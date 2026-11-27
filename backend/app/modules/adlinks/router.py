"""Ad link library and discovery queue (admin only)."""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core import cache
from app.modules.adlinks import discovery
from app.modules.adlinks.models import ACTIVE, DECLINED, PAUSED, PENDING, AdLink
from app.modules.assets import youtube
from app.modules.assets.models import Asset, AssetKind, AssetStatus
from app.modules.campaigns.defaults import DEFAULT_DISPLAY_SECONDS
from app.modules.campaigns.models import Campaign, CampaignStatus
from app.modules.users.deps import AdminUser, DbSession
from app.modules.verification.models import Interaction

router = APIRouter(prefix="/admin/ad-links", tags=["admin"])

FETCH_TARGET = 20


class AdLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    youtube_id: str
    url: str
    title: str | None
    channel_title: str | None
    description: str | None
    thumbnail_url: str | None
    embed_url: str = ""
    duration_seconds: float | None
    category: str | None
    source: str
    status: str  # pending | active | paused | declined | removed | completed | expired
    campaign_id: uuid.UUID | None
    created_at: datetime
    decided_at: datetime | None


class FetchIn(BaseModel):
    count: int = Field(default=FETCH_TARGET, ge=1, le=50)


class FetchOut(BaseModel):
    added: int
    items: list[AdLinkOut]


class DecisionIn(BaseModel):
    reward_rate: Decimal = Field(default=Decimal("0.50"), gt=0, max_digits=12, decimal_places=2)
    budget_total: Decimal = Field(default=Decimal("100"), gt=0, max_digits=14, decimal_places=2)
    is_demo: bool = True


def _effective_status(link: AdLink, campaign: Campaign | None) -> str:
    if link.status in (ACTIVE, PAUSED):
        if campaign is None:
            return "removed"
        if campaign.status == CampaignStatus.active:
            return ACTIVE
        if campaign.status in (CampaignStatus.paused, CampaignStatus.draft):
            return PAUSED
        return campaign.status.value
    return link.status


def _out(link: AdLink, campaign: Campaign | None) -> AdLinkOut:
    o = AdLinkOut.model_validate(link)
    o.status = _effective_status(link, campaign)
    o.embed_url = youtube.embed_url(link.youtube_id)
    return o


async def sync_existing(session) -> None:
    """Make sure every YouTube creative already on the platform has a stored link."""
    known = set(await session.scalars(select(AdLink.youtube_id)))
    assets: dict[str, Asset] = {}
    for a in await session.scalars(select(Asset).where(Asset.kind == AssetKind.youtube, Asset.youtube_id.is_not(None))):
        if a.youtube_id not in known:
            assets.setdefault(a.youtube_id, a)  # several assets can share one video; keep one link
    for a in assets.values():
        campaign = await session.scalar(select(Campaign).where(Campaign.asset_id == a.id).order_by(Campaign.created_at))
        session.add(
            AdLink(
                youtube_id=a.youtube_id,
                url=youtube.watch_url(a.youtube_id),
                title=a.title,
                thumbnail_url=youtube.thumbnail_url(a.youtube_id),
                duration_seconds=a.duration_seconds,
                category=campaign.category if campaign else None,
                source="existing",
                status=ACTIVE if campaign else PAUSED,
                asset_id=a.id,
                campaign_id=campaign.id if campaign else None,
            )
        )
    if assets:
        await session.commit()


async def _get_link(session, link_id: uuid.UUID) -> AdLink:
    link = await session.get(AdLink, link_id, with_for_update=True)
    if link is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ad link not found")
    return link


async def _invalidate():
    await cache.invalidate("campaigns:live", "analytics:*")


@router.get("", response_model=list[AdLinkOut])
async def list_links(_: AdminUser, session: DbSession, status_: str | None = None, q: str | None = None):
    await sync_existing(session)
    stmt = (
        select(AdLink, Campaign)
        .outerjoin(Campaign, AdLink.campaign_id == Campaign.id)
        .order_by(AdLink.created_at.desc())
        .limit(2000)
    )
    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            func.lower(func.coalesce(AdLink.title, "")).like(like)
            | func.lower(func.coalesce(AdLink.channel_title, "")).like(like)
            | (AdLink.youtube_id == q.strip())
        )
    rows = (await session.execute(stmt)).all()
    out = [_out(link, c) for link, c in rows]
    return [o for o in out if o.status == status_] if status_ else out


@router.post("/fetch", response_model=FetchOut)
async def fetch_ads(body: FetchIn, _: AdminUser, session: DbSession) -> FetchOut:
    """Search YouTube for new ad videos and queue them as pending. Known links are never re-added."""
    await sync_existing(session)
    known = set(await session.scalars(select(AdLink.youtube_id)))
    try:
        found = await discovery.discover(body.count, known)
    except discovery.DiscoveryError as e:
        raise HTTPException(e.code, str(e)) from e
    if found:
        await session.execute(
            pg_insert(AdLink)
            .values(
                [
                    {
                        "id": uuid.uuid4(),
                        "youtube_id": f.youtube_id,
                        "url": youtube.watch_url(f.youtube_id),
                        "title": f.title,
                        "channel_title": f.channel_title,
                        "description": f.description,
                        "thumbnail_url": f.thumbnail_url,
                        "duration_seconds": f.duration_seconds,
                        "category": f.category,
                        "source": "fetched",
                        "status": PENDING,
                    }
                    for f in found
                ]
            )
            .on_conflict_do_nothing(index_elements=["youtube_id"])
        )
        await session.commit()
    rows = (
        await session.execute(
            select(AdLink, Campaign)
            .outerjoin(Campaign, AdLink.campaign_id == Campaign.id)
            .where(AdLink.youtube_id.in_([f.youtube_id for f in found]))
            .order_by(AdLink.category, AdLink.created_at)
        )
    ).all()
    return FetchOut(added=len(rows), items=[_out(link, c) for link, c in rows])


async def _publish(session, link: AdLink, admin_id: uuid.UUID, body: DecisionIn, campaign_status: CampaignStatus):
    """Create the creative and campaign for a link (or reuse them)."""
    if link.campaign_id and (c := await session.get(Campaign, link.campaign_id)):
        c.status = campaign_status
        return c
    asset = await session.get(Asset, link.asset_id) if link.asset_id else None
    if asset is None:
        asset = Asset(
            id=uuid.uuid4(), owner_id=admin_id, kind=AssetKind.youtube, status=AssetStatus.ready, original_key="",
            youtube_id=link.youtube_id, title=link.title, duration_seconds=link.duration_seconds,
        )
        session.add(asset)
        await session.flush()
    c = Campaign(
        advertiser_id=admin_id,
        asset_id=asset.id,
        name=(link.title or link.youtube_id)[:200],
        brand=(link.channel_title or "YouTube")[:120],
        category=link.category or "General",
        description=(link.description or link.title or "Sponsored video")[:500],
        is_demo=body.is_demo,
        status=campaign_status,
        reward_rate=body.reward_rate,
        budget_total=body.budget_total,
        budget_spent=Decimal("0"),
        display_seconds=DEFAULT_DISPLAY_SECONDS,
        rating_prompt="How relevant was this ad to you?",
        question="Did this ad clearly show what it was promoting?",
        options=["Yes", "Somewhat", "No"],
        correct_option=None,
        targeting={},
    )
    session.add(c)
    await session.flush()
    link.asset_id, link.campaign_id = asset.id, c.id
    return c


async def _decide(session, link: AdLink, admin: AdminUser, new_status: str):
    link.status = new_status
    link.decided_by = admin.id
    link.decided_at = datetime.now(UTC)
    await session.commit()
    await _invalidate()
    campaign = await session.get(Campaign, link.campaign_id) if link.campaign_id else None
    return _out(link, campaign)


@router.post("/{link_id}/approve", response_model=AdLinkOut)
async def approve(link_id: uuid.UUID, admin: AdminUser, session: DbSession, body: DecisionIn | None = None):
    link = await _get_link(session, link_id)
    if link.status == DECLINED:
        raise HTTPException(status.HTTP_409_CONFLICT, "This link was declined")
    await _publish(session, link, admin.id, body or DecisionIn(), CampaignStatus.active)
    return await _decide(session, link, admin, ACTIVE)


@router.post("/{link_id}/pause", response_model=AdLinkOut)
async def pause(link_id: uuid.UUID, admin: AdminUser, session: DbSession, body: DecisionIn | None = None):
    """Keep the ad but hide it from users. It can be shown later from the Ads list."""
    link = await _get_link(session, link_id)
    if link.status == DECLINED:
        raise HTTPException(status.HTTP_409_CONFLICT, "This link was declined")
    await _publish(session, link, admin.id, body or DecisionIn(), CampaignStatus.paused)
    return await _decide(session, link, admin, PAUSED)


@router.post("/{link_id}/decline", response_model=AdLinkOut)
async def decline(link_id: uuid.UUID, admin: AdminUser, session: DbSession, force: bool = False):
    """Remove the ad completely (campaign and creative). The link stays stored so it is never fetched again."""
    link = await _get_link(session, link_id)
    if link.campaign_id:
        n = await session.scalar(select(func.count(Interaction.id)).where(Interaction.campaign_id == link.campaign_id))
        if n and not force:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"This ad has {n} recorded view(s). Pause it instead, or confirm to delete it with its history.",
            )
        await session.execute(delete(Interaction).where(Interaction.campaign_id == link.campaign_id))
        await session.execute(delete(Campaign).where(Campaign.id == link.campaign_id))
    if link.asset_id:
        await session.execute(delete(Asset).where(Asset.id == link.asset_id))
    link.campaign_id = link.asset_id = None
    return await _decide(session, link, admin, DECLINED)
