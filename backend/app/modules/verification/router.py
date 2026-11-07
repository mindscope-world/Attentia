import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.core import cache
from app.modules.users.deps import CurrentUser, DbSession
from app.modules.verification import service
from app.modules.verification.models import Interaction, InteractionStatus

router = APIRouter(prefix="/interactions", tags=["verification"])


class StartIn(BaseModel):
    campaign_id: uuid.UUID


class EventIn(BaseModel):
    type: service.EventType
    position: float = Field(ge=0)


class EventsIn(BaseModel):
    events: list[EventIn] = Field(min_length=1, max_length=200)


class SubmitIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    answer: str = Field(max_length=300)
    feedback: str | None = Field(default=None, max_length=2000)


class InteractionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    campaign_id: uuid.UUID
    status: InteractionStatus
    started_at: datetime
    required_seconds: float
    watched_seconds: float
    rating: int | None
    answer: str | None
    feedback: str | None
    submitted_at: datetime | None
    verified_at: datetime | None
    rejection_reason: str | None
    reward_amount: Decimal | None


def _raise(e: service.VerificationError):
    raise HTTPException(e.code, str(e))


@router.post("", response_model=InteractionOut, status_code=status.HTTP_201_CREATED)
async def start_interaction(body: StartIn, request: Request, user: CurrentUser, session: DbSession):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    try:
        it = await session.run_sync(
            lambda s: service.start(s, user_id=user.id, campaign_id=body.campaign_id, ip=ip, ua=ua)
        )
    except service.VerificationError as e:
        await session.rollback()
        _raise(e)
    await session.commit()
    return it


@router.post("/{interaction_id}/events", response_model=InteractionOut)
async def post_events(interaction_id: uuid.UUID, body: EventsIn, user: CurrentUser, session: DbSession):
    events = [service.PlaybackEvent(e.type, e.position) for e in body.events]
    try:
        it = await session.run_sync(
            lambda s: service.record_events(s, interaction_id=interaction_id, user_id=user.id, events=events)
        )
    except service.VerificationError as e:
        await session.rollback()
        _raise(e)
    await session.commit()
    return it


@router.post("/{interaction_id}/submit", response_model=InteractionOut)
async def submit_interaction(
    interaction_id: uuid.UUID, body: SubmitIn, user: CurrentUser, session: DbSession
):
    try:
        it = await session.run_sync(
            lambda s: service.submit(
                s,
                interaction_id=interaction_id,
                user_id=user.id,
                rating=body.rating,
                answer=body.answer,
                feedback=body.feedback,
            )
        )
    except service.VerificationError as e:
        await session.rollback()
        _raise(e)
    await session.commit()
    if it.status == InteractionStatus.verified:
        await cache.invalidate(f"analytics:user:{user.id}", "analytics:admin*", f"analytics:campaign:{it.campaign_id}")
    return it


@router.get("", response_model=list[InteractionOut])
async def my_interactions(user: CurrentUser, session: DbSession, limit: int = 100, offset: int = 0):
    rows = await session.scalars(
        select(Interaction)
        .where(Interaction.user_id == user.id)
        .order_by(Interaction.started_at.desc())
        .limit(min(limit, 500))
        .offset(offset)
    )
    return list(rows)
