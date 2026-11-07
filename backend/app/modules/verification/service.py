"""Attention verification. Rewards are only credited here, after server-side checks.

Playback accounting trusts the server clock, not the client: a progress event may advance
the watched time by at most the wall-clock time elapsed since the previous event (plus a
small tolerance). Seeking forward or replaying an old position earns nothing.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.assets.models import AssetStatus
from app.modules.campaigns.models import Campaign
from app.modules.campaigns.service import budget_remaining, is_live_clause, utc_today
from app.modules.packages.models import Subscription, SubscriptionStatus
from app.modules.rewards.service import calculate_reward, credit_reward, lock_user
from app.modules.verification.models import Interaction, InteractionStatus

CLOCK_TOLERANCE_S = 1.5
MAX_EVENTS = 2000

EventType = Literal["play", "pause", "progress", "seek", "ended", "hidden", "visible"]


class VerificationError(Exception):
    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.code = code


@dataclass
class PlaybackEvent:
    type: str
    position: float


def required_seconds(campaign: Campaign) -> float:
    asset = campaign.asset
    if asset is not None and asset.status == AssetStatus.ready and asset.duration_seconds:
        base = asset.duration_seconds
    else:
        base = float(campaign.display_seconds)
    return round(base * campaign.min_watch_pct, 2)


def daily_quota(session: Session, user_id: uuid.UUID) -> tuple[Subscription | None, int, int]:
    now = datetime.now(UTC)
    sub = session.scalar(
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.expires_at > now,
        )
        .order_by(Subscription.activated_at.desc())
        .limit(1)
    )
    used = session.scalar(
        select(func.count(Interaction.id)).where(
            Interaction.user_id == user_id,
            Interaction.day == utc_today(),
            Interaction.status == InteractionStatus.verified,
        )
    )
    quota = sub.package.daily_quota if sub else 0
    return sub, quota, int(used or 0)


def start(
    session: Session, *, user_id: uuid.UUID, campaign_id: uuid.UUID, ip: str | None, ua: str | None
) -> Interaction:
    campaign = session.scalar(select(Campaign).where(Campaign.id == campaign_id, is_live_clause()))
    if campaign is None:
        raise VerificationError("Campaign is not available", 404)

    sub, quota, used = daily_quota(session, user_id)
    if sub is None:
        raise VerificationError("An active participation package is required", 403)
    if used >= quota:
        raise VerificationError("Daily task quota reached", 429)

    today = utc_today()
    existing = session.scalar(
        select(Interaction).where(
            Interaction.user_id == user_id, Interaction.campaign_id == campaign_id, Interaction.day == today
        )
    )
    if existing is not None:
        if existing.status == InteractionStatus.started:
            return existing  # resume the same attempt
        raise VerificationError("You have already completed this task today", 409)

    campaign_today = session.scalar(
        select(func.count(Interaction.id)).where(
            Interaction.campaign_id == campaign_id,
            Interaction.day == today,
            Interaction.status == InteractionStatus.verified,
        )
    )
    if campaign_today >= campaign.daily_interaction_limit:
        raise VerificationError("This campaign has reached its daily limit", 429)

    now = datetime.now(UTC)
    interaction = Interaction(
        user_id=user_id,
        campaign_id=campaign_id,
        day=today,
        started_at=now,
        last_event_at=now,
        required_seconds=required_seconds(campaign),
        client_ip=ip,
        user_agent=(ua or "")[:400] or None,
        events=[],
    )
    session.add(interaction)
    session.flush()
    return interaction


def _owned_started(session: Session, interaction_id: uuid.UUID, user_id: uuid.UUID) -> Interaction:
    it = session.scalar(
        select(Interaction).where(Interaction.id == interaction_id).with_for_update()
    )
    if it is None or it.user_id != user_id:
        raise VerificationError("Interaction not found", 404)
    if it.status != InteractionStatus.started:
        raise VerificationError(f"Interaction is already {it.status}", 409)
    return it


def record_events(
    session: Session, *, interaction_id: uuid.UUID, user_id: uuid.UUID, events: list[PlaybackEvent]
) -> Interaction:
    it = _owned_started(session, interaction_id, user_id)
    if it.event_count + len(events) > MAX_EVENTS:
        raise VerificationError("Too many playback events", 429)

    now = datetime.now(UTC)
    elapsed = (now - (it.last_event_at or it.started_at)).total_seconds()
    budget = max(0.0, elapsed) + CLOCK_TOLERANCE_S  # seconds of credit this batch may earn
    log = list(it.events or [])

    for ev in events:
        pos = max(0.0, float(ev.position))
        if ev.type in ("progress", "ended", "pause"):
            advance = pos - it.last_position
            if advance < 0 or advance > budget:
                # Rewind or forward jump: no credit, flag forward jumps.
                if advance > budget:
                    it.suspicious_events += 1
            else:
                it.watched_seconds += advance
                budget -= advance
        elif ev.type == "seek" and pos > it.last_position + CLOCK_TOLERANCE_S:
            it.suspicious_events += 1
        it.last_position = pos
        log.append({"t": ev.type, "p": round(pos, 2), "at": now.isoformat()})

    it.events = log[-MAX_EVENTS:]
    it.event_count += len(events)
    it.last_event_at = now
    session.flush()
    return it


def submit(
    session: Session,
    *,
    interaction_id: uuid.UUID,
    user_id: uuid.UUID,
    rating: int,
    answer: str,
    feedback: str | None,
) -> Interaction:
    lock_user(session, user_id)
    it = _owned_started(session, interaction_id, user_id)
    campaign = session.scalar(select(Campaign).where(Campaign.id == it.campaign_id).with_for_update(of=Campaign))
    now = datetime.now(UTC)

    it.rating, it.answer, it.feedback, it.submitted_at = rating, answer, (feedback or None), now

    reason = _rejection_reason(session, it, campaign, now, rating, answer, feedback, user_id)
    if reason:
        it.status = InteractionStatus.rejected
        it.rejection_reason = reason
        session.flush()
        return it

    reward = calculate_reward(Decimal(campaign.reward_rate))
    campaign.budget_spent = Decimal(campaign.budget_spent) + Decimal(campaign.reward_rate)
    it.status = InteractionStatus.verified
    it.verified_at = now
    it.reward_amount = reward
    credit_reward(
        session,
        user_id=user_id,
        interaction_id=it.id,
        amount=reward,
        description=f"Verified engagement: {campaign.brand} — {campaign.name}",
    )
    session.flush()
    return it


def _rejection_reason(session, it, campaign, now, rating, answer, feedback, user_id) -> str | None:
    if campaign is None:
        return "Campaign no longer exists"
    if not session.scalar(select(Campaign.id).where(Campaign.id == campaign.id, is_live_clause(now))):
        return "Campaign is no longer active"
    if budget_remaining(campaign) < Decimal(campaign.reward_rate):
        return "Campaign budget exhausted"

    elapsed = (now - it.started_at).total_seconds()
    if elapsed + CLOCK_TOLERANCE_S < it.required_seconds:
        return f"Submitted after {elapsed:.0f}s; at least {it.required_seconds:.0f}s of viewing is required"
    has_video = campaign.asset is not None and campaign.asset.kind == "video" and campaign.asset.media_key
    if has_video and it.watched_seconds + CLOCK_TOLERANCE_S < it.required_seconds:
        return f"Watched {it.watched_seconds:.0f}s of the required {it.required_seconds:.0f}s"
    if it.suspicious_events > 3:
        return "Suspicious playback activity detected"

    if not 1 <= rating <= 5:
        return "Rating must be between 1 and 5"
    if answer not in (campaign.options or []):
        return "Answer is not one of the available options"
    if campaign.correct_option and answer != campaign.correct_option:
        return "Comprehension check failed"
    if campaign.requires_feedback and len((feedback or "").strip()) < 10:
        return "Written feedback of at least 10 characters is required"

    _, quota, used = daily_quota(session, user_id)
    if used >= quota:
        return "Daily task quota reached"
    return None
