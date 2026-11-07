import uuid
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core import cache, storage
from app.modules.assets import youtube
from app.modules.assets.models import Asset, AssetStatus
from app.modules.campaigns.models import Campaign, CampaignStatus
from app.modules.campaigns.schemas import (
    CampaignIn,
    CampaignOut,
    CampaignStatusIn,
    CampaignUpdateIn,
    FeedItem,
    FeedOut,
)
from app.modules.campaigns.service import live_campaigns_stmt, utc_today
from app.modules.rewards.service import calculate_reward
from app.modules.users.deps import AdvertiserOrAdmin, CurrentUser, DbSession
from app.modules.users.models import Role, User
from app.modules.verification.models import Interaction
from app.modules.verification.service import daily_quota

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

LIVE_CACHE_KEY = "campaigns:live"


async def _invalidate():
    await cache.invalidate(LIVE_CACHE_KEY, "analytics:*")


async def _get_owned(session, campaign_id: uuid.UUID, user: User) -> Campaign:
    c = await session.get(Campaign, campaign_id)
    if c is None or (user.role != Role.admin and c.advertiser_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")
    return c


async def _check_asset(session, asset_id: uuid.UUID | None, user: User) -> None:
    if asset_id is None:
        return
    asset = await session.get(Asset, asset_id)
    if asset is None or (user.role != Role.admin and asset.owner_id != user.id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown asset")


async def _load_live(session) -> list[dict]:
    rows = (await session.scalars(live_campaigns_stmt())).unique()
    out = []
    for c in rows:
        asset = c.asset if c.asset and c.asset.status == AssetStatus.ready else None
        out.append(
            {
                "id": str(c.id),
                "name": c.name,
                "brand": c.brand,
                "category": c.category,
                "description": c.description,
                "is_demo": c.is_demo,
                "reward": str(calculate_reward(Decimal(c.reward_rate))),
                "duration_seconds": asset.duration_seconds if asset and asset.duration_seconds else c.display_seconds,
                "media_kind": str(asset.kind) if asset else None,
                "media_key": asset.media_key if asset else None,
                "youtube_id": asset.youtube_id if asset else None,
                "thumbnail_key": asset.thumbnail_key if asset else None,
                "min_watch_pct": c.min_watch_pct,
                "requires_feedback": c.requires_feedback,
                "rating_prompt": c.rating_prompt,
                "question": c.question,
                "options": c.options,
            }
        )
    return out


@router.get("/feed", response_model=FeedOut)
async def feed(user: CurrentUser, session: DbSession) -> FeedOut:
    """Available sponsored-content tasks for the current participant."""
    live = await cache.cached(LIVE_CACHE_KEY, lambda: _load_live(session), ttl=30)
    sub, quota, used = await session.run_sync(lambda s: daily_quota(s, user.id))
    done_today = set(
        await session.scalars(
            select(Interaction.campaign_id).where(
                Interaction.user_id == user.id, Interaction.day == utc_today()
            )
        )
    )
    items = []
    for c in live:
        cid = uuid.UUID(c["id"])
        yt = c.get("youtube_id")
        if yt:
            media = {
                "media_url": youtube.watch_url(yt),
                "thumbnail_url": youtube.thumbnail_url(yt),
                "embed_url": youtube.embed_url(yt),
            }
        else:
            media = {
                "media_url": storage.presigned_get(c["media_key"]),
                "thumbnail_url": storage.presigned_get(c["thumbnail_key"]),
            }
        items.append(
            FeedItem(
                **{k: v for k, v in c.items() if k not in ("media_key", "thumbnail_key", "id")},
                **media,
                id=cid,
                completed_today=cid in done_today,
            )
        )
    return FeedOut(
        package=sub.package.code if sub else None,
        daily_quota=quota,
        completed_today=used,
        remaining_quota=max(0, quota - used),
        items=items,
    )


@router.get("", response_model=list[CampaignOut])
async def list_campaigns(user: AdvertiserOrAdmin, session: DbSession, status_: CampaignStatus | None = None):
    q = select(Campaign).order_by(Campaign.created_at.desc())
    if user.role != Role.admin:
        q = q.where(Campaign.advertiser_id == user.id)
    if status_:
        q = q.where(Campaign.status == status_)
    return list((await session.scalars(q)).unique())


@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(body: CampaignIn, user: AdvertiserOrAdmin, session: DbSession) -> Campaign:
    await _check_asset(session, body.asset_id, user)
    if user.role != Role.admin and body.is_demo:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only admins can create demo campaigns")
    c = Campaign(**body.model_dump(), advertiser_id=user.id, status=CampaignStatus.draft)
    session.add(c)
    await session.commit()
    await session.refresh(c)
    return c


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(campaign_id: uuid.UUID, user: AdvertiserOrAdmin, session: DbSession) -> Campaign:
    return await _get_owned(session, campaign_id, user)


@router.patch("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID, body: CampaignUpdateIn, user: AdvertiserOrAdmin, session: DbSession
) -> Campaign:
    c = await _get_owned(session, campaign_id, user)
    data = body.model_dump(exclude_unset=True)
    if "asset_id" in data:
        await _check_asset(session, data["asset_id"], user)
    if data.get("is_demo") and user.role != Role.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only admins can mark demo campaigns")
    for field, value in data.items():
        setattr(c, field, value)
    options = c.options or []
    if c.correct_option is not None and c.correct_option not in options:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "correct_option must be one of options")
    await session.commit()
    await session.refresh(c)
    await _invalidate()
    return c


@router.post("/{campaign_id}/status", response_model=CampaignOut)
async def set_status(
    campaign_id: uuid.UUID, body: CampaignStatusIn, user: AdvertiserOrAdmin, session: DbSession
) -> Campaign:
    c = await _get_owned(session, campaign_id, user)
    allowed = {CampaignStatus.active, CampaignStatus.paused, CampaignStatus.draft}
    if body.status not in allowed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Status can only be set to draft, active or paused")
    if c.status in (CampaignStatus.completed, CampaignStatus.expired):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Campaign is {c.status}")
    if body.status == CampaignStatus.active and c.asset_id:
        asset = await session.get(Asset, c.asset_id)
        if asset is None or asset.status != AssetStatus.ready:
            raise HTTPException(status.HTTP_409_CONFLICT, "Creative is not processed yet")
    c.status = body.status
    await session.commit()
    await session.refresh(c)
    await _invalidate()
    return c
