import uuid
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.core import cache
from app.modules.campaigns.models import Campaign, CampaignStatus
from app.modules.campaigns.service import utc_today
from app.modules.payments.models import Deposit, DepositStatus, Withdrawal, WithdrawalStatus
from app.modules.rewards.models import EntryType, LedgerAccount, LedgerEntry
from app.modules.users.deps import AdminUser, AdvertiserOrAdmin, CurrentUser, DbSession
from app.modules.users.models import Role, User
from app.modules.verification.models import Interaction, InteractionStatus

router = APIRouter(prefix="/analytics", tags=["analytics"])

V = InteractionStatus.verified


def _f(x) -> float:
    return round(float(x or 0), 4)


@router.get("/me")
async def participant_analytics(user: CurrentUser, session: DbSession):
    async def load():
        since = utc_today() - timedelta(days=13)
        totals = (
            await session.execute(
                select(
                    func.count().filter(Interaction.status == V),
                    func.count().filter(Interaction.status == InteractionStatus.rejected),
                    func.avg(Interaction.rating).filter(Interaction.status == V),
                    func.coalesce(func.sum(Interaction.reward_amount), 0),
                ).where(Interaction.user_id == user.id)
            )
        ).one()
        daily = (
            await session.execute(
                select(Interaction.day, func.count(), func.coalesce(func.sum(Interaction.reward_amount), 0))
                .where(Interaction.user_id == user.id, Interaction.status == V, Interaction.day >= since)
                .group_by(Interaction.day)
                .order_by(Interaction.day)
            )
        ).all()
        return {
            "verified_tasks": totals[0],
            "rejected_tasks": totals[1],
            "average_rating_given": _f(totals[2]),
            "total_verified_rewards": _f(totals[3]),
            "daily": [{"day": d.isoformat(), "tasks": n, "rewards": _f(r)} for d, n, r in daily],
        }

    return await cache.cached(f"analytics:user:{user.id}", load)


async def _campaign_stats(session, campaign_ids: list[uuid.UUID] | None) -> list[dict]:
    q = (
        select(
            Campaign.id,
            Campaign.name,
            Campaign.brand,
            Campaign.status,
            Campaign.budget_total,
            Campaign.budget_spent,
            func.count(Interaction.id).label("started"),
            func.count(Interaction.id).filter(Interaction.status == V).label("verified"),
            func.avg(Interaction.rating).filter(Interaction.status == V).label("avg_rating"),
            func.count(Interaction.feedback).filter(Interaction.status == V).label("feedback_count"),
        )
        .outerjoin(Interaction, Interaction.campaign_id == Campaign.id)
        .group_by(Campaign.id)
        .order_by(Campaign.created_at.desc())
    )
    if campaign_ids is not None:
        q = q.where(Campaign.id.in_(campaign_ids))
    out = []
    for r in (await session.execute(q)).all():
        spent = float(r.budget_spent or 0)
        out.append(
            {
                "campaign_id": str(r.id),
                "name": r.name,
                "brand": r.brand,
                "status": r.status.value,
                "started_interactions": r.started,
                "verified_views": r.verified,
                "completion_rate": _f(r.verified / r.started) if r.started else 0.0,
                "average_rating": _f(r.avg_rating),
                "feedback_count": r.feedback_count,
                "budget_total": _f(r.budget_total),
                "budget_spent": _f(spent),
                "budget_utilization": _f(spent / float(r.budget_total)) if r.budget_total else 0.0,
                "cost_per_verified_interaction": _f(spent / r.verified) if r.verified else None,
            }
        )
    return out


@router.get("/campaigns")
async def advertiser_analytics(user: AdvertiserOrAdmin, session: DbSession):
    async def load():
        ids = None
        if user.role != Role.admin:
            ids = list(await session.scalars(select(Campaign.id).where(Campaign.advertiser_id == user.id)))
        return await _campaign_stats(session, ids)

    return await cache.cached(f"analytics:advertiser:{user.id}", load)


@router.get("/campaigns/{campaign_id}")
async def campaign_analytics(campaign_id: uuid.UUID, user: AdvertiserOrAdmin, session: DbSession):
    c = await session.get(Campaign, campaign_id)
    if c is None or (user.role != Role.admin and c.advertiser_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")

    async def load():
        stats = (await _campaign_stats(session, [campaign_id]))[0]
        feedback = (
            await session.execute(
                select(Interaction.rating, Interaction.answer, Interaction.feedback, Interaction.verified_at)
                .where(Interaction.campaign_id == campaign_id, Interaction.status == V)
                .order_by(Interaction.verified_at.desc())
                .limit(50)
            )
        ).all()
        answers = (
            await session.execute(
                select(Interaction.answer, func.count())
                .where(Interaction.campaign_id == campaign_id, Interaction.status == V)
                .group_by(Interaction.answer)
            )
        ).all()
        stats["answer_distribution"] = {a: n for a, n in answers}
        stats["recent_feedback"] = [
            {"rating": r, "answer": a, "feedback": f, "at": t.isoformat() if t else None} for r, a, f, t in feedback
        ]
        return stats

    return await cache.cached(f"analytics:campaign:{campaign_id}", load)


@router.get("/admin")
async def admin_analytics(_: AdminUser, session: DbSession):
    async def load():
        today = utc_today()
        users = (
            await session.execute(
                select(
                    func.count(User.id),
                    func.count().filter(User.role == Role.participant),
                )
            )
        ).one()
        active_participants = await session.scalar(
            select(func.count(func.distinct(Interaction.user_id))).where(Interaction.day >= today - timedelta(days=7))
        )
        inter = (
            await session.execute(
                select(
                    func.count(Interaction.id),
                    func.count().filter(Interaction.status == V),
                    func.count().filter(Interaction.status == InteractionStatus.rejected),
                    func.coalesce(func.sum(Interaction.suspicious_events), 0),
                )
            )
        ).one()
        active_campaigns = await session.scalar(
            select(func.count(Campaign.id)).where(Campaign.status == CampaignStatus.active)
        )
        spend = await session.scalar(select(func.coalesce(func.sum(Campaign.budget_spent), 0)))
        liabilities = await session.scalar(
            select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
                LedgerEntry.account.in_([LedgerAccount.rewards, LedgerAccount.pending_withdrawal])
            )
        )
        rewards_paid = await session.scalar(
            select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(LedgerEntry.entry_type == EntryType.reward)
        )
        deposits = await session.scalar(
            select(func.coalesce(func.sum(Deposit.received_amount), 0)).where(
                Deposit.status.in_([DepositStatus.confirmed, DepositStatus.underpaid])
            )
        )
        withdrawals = (
            await session.execute(
                select(
                    func.coalesce(func.sum(Withdrawal.amount).filter(Withdrawal.status == WithdrawalStatus.completed), 0),
                    func.count().filter(Withdrawal.status == WithdrawalStatus.requested),
                )
            )
        ).one()
        return {
            "registered_users": users[0],
            "registered_participants": int(users[1] or 0),
            "active_participants_7d": active_participants,
            "active_campaigns": active_campaigns,
            "total_interactions": inter[0],
            "verified_tasks": inter[1],
            "rejected_tasks": inter[2],
            "suspicious_playback_events": int(inter[3]),
            "campaign_spend": _f(spend),
            "rewards_credited": _f(rewards_paid),
            "reward_liabilities": _f(liabilities),
            "deposit_volume": _f(deposits),
            "withdrawal_volume": _f(withdrawals[0]),
            "withdrawals_awaiting_review": withdrawals[1],
        }

    return await cache.cached("analytics:admin", load, ttl=30)
