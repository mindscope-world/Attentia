"""Admin-only operations: user moderation, fund adjustments, deposits and ad deletion."""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import String, cast, delete, func, or_, select

from app.core import cache
from app.modules.campaigns.models import Campaign
from app.modules.payments.models import Deposit, DepositStatus, Network, Withdrawal
from app.modules.rewards.models import EntryType, LedgerAccount, LedgerEntry
from app.modules.rewards.service import balances_stmt, lock_user, post, q2, to_balances
from app.modules.users.deps import AdminUser, DbSession
from app.modules.users.models import Role, User
from app.modules.verification.models import Interaction

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    username: str
    full_name: str | None
    role: Role
    kyc_status: str
    is_active: bool
    banned_at: datetime | None
    ban_reason: str | None
    created_at: datetime


class AdminUserRow(AdminUserOut):
    available: Decimal = Decimal("0")


class LedgerRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account: LedgerAccount
    entry_type: EntryType
    amount: Decimal
    description: str | None
    created_at: datetime


class AdminUserDetail(BaseModel):
    user: AdminUserOut
    balances: dict[str, Decimal]
    recent_ledger: list[LedgerRow]
    withdrawals_pending: int
    verified_tasks: int


class BanIn(BaseModel):
    reason: str = Field(min_length=3, max_length=300)


class AdjustIn(BaseModel):
    # Positive credits the user's withdrawable balance, negative debits it.
    amount: Decimal = Field(max_digits=18, decimal_places=2)
    reason: str = Field(min_length=3, max_length=250)


class AdminDepositOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    network: Network
    asset: str
    expected_amount: Decimal
    received_amount: Decimal | None
    tx_hash: str | None
    status: DepositStatus
    created_at: datetime
    confirmed_at: datetime | None


async def _get_user(session, user_id: uuid.UUID) -> User:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.get("/users", response_model=list[AdminUserRow])
async def list_users(
    _: AdminUser,
    session: DbSession,
    q: str | None = None,
    role: Role | None = None,
    banned: bool | None = None,
    limit: int = 100,
    offset: int = 0,
):
    stmt = select(User).order_by(User.created_at.desc()).limit(min(limit, 500)).offset(offset)
    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(func.lower(User.email).like(like), func.lower(User.username).like(like), cast(User.id, String) == q.strip())
        )
    if role:
        stmt = stmt.where(User.role == role)
    if banned is not None:
        stmt = stmt.where(User.banned_at.is_not(None) if banned else User.banned_at.is_(None))
    users = list(await session.scalars(stmt))
    avail = dict(
        (
            await session.execute(
                select(LedgerEntry.user_id, func.coalesce(func.sum(LedgerEntry.amount), 0))
                .where(LedgerEntry.account == LedgerAccount.rewards, LedgerEntry.user_id.in_([u.id for u in users]))
                .group_by(LedgerEntry.user_id)
            )
        ).all()
    )
    return [AdminUserRow(**AdminUserOut.model_validate(u).model_dump(), available=q2(Decimal(avail.get(u.id, 0)))) for u in users]


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def user_detail(user_id: uuid.UUID, _: AdminUser, session: DbSession):
    user = await _get_user(session, user_id)
    balances = to_balances((await session.execute(balances_stmt(user.id))).all())
    ledger = list(
        await session.scalars(
            select(LedgerEntry).where(LedgerEntry.user_id == user.id).order_by(LedgerEntry.created_at.desc()).limit(25)
        )
    )
    pending = await session.scalar(
        select(func.count(Withdrawal.id)).where(Withdrawal.user_id == user.id, Withdrawal.status == "requested")
    )
    verified = await session.scalar(
        select(func.count(Interaction.id)).where(Interaction.user_id == user.id, Interaction.status == "verified")
    )
    return AdminUserDetail(
        user=AdminUserOut.model_validate(user),
        balances=balances,
        recent_ledger=[LedgerRow.model_validate(e) for e in ledger],
        withdrawals_pending=pending or 0,
        verified_tasks=verified or 0,
    )


@router.post("/users/{user_id}/ban", response_model=AdminUserOut)
async def ban_user(user_id: uuid.UUID, body: BanIn, admin: AdminUser, session: DbSession):
    user = await _get_user(session, user_id)
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot ban your own account")
    if user.role == Role.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Demote an admin before banning them")
    user.is_active = False
    user.banned_at = datetime.now(UTC)
    user.ban_reason = body.reason
    await session.commit()
    return user


@router.post("/users/{user_id}/unban", response_model=AdminUserOut)
async def unban_user(user_id: uuid.UUID, _: AdminUser, session: DbSession):
    user = await _get_user(session, user_id)
    user.is_active = True
    user.banned_at = None
    user.ban_reason = None
    await session.commit()
    return user


@router.post("/users/{user_id}/adjust", response_model=AdminUserDetail)
async def adjust_funds(user_id: uuid.UUID, body: AdjustIn, admin: AdminUser, session: DbSession):
    """Credit or debit a user's withdrawable balance. Posts an append-only ledger adjustment."""
    if body.amount == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Amount must not be zero")
    user = await _get_user(session, user_id)

    def _post(s):
        lock_user(s, user.id)
        current = to_balances(s.execute(balances_stmt(user.id)).all())[LedgerAccount.rewards.value]
        if current + body.amount < 0:
            return False
        post(
            s,
            user_id=user.id,
            entry_type=EntryType.adjustment,
            reference_type="admin_adjustment",
            reference_id=uuid.uuid4(),
            legs=[(LedgerAccount.rewards, q2(body.amount))],
            description=f"Admin adjustment by {admin.username}: {body.reason}",
        )
        return True

    if not await session.run_sync(_post):
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Adjustment would make the balance negative")
    await session.commit()
    await cache.invalidate("analytics:*")
    return await user_detail(user_id, admin, session)


@router.get("/deposits", response_model=list[AdminDepositOut])
async def list_deposits(_: AdminUser, session: DbSession, status_: DepositStatus | None = None, limit: int = 200):
    stmt = select(Deposit).order_by(Deposit.created_at.desc()).limit(min(limit, 500))
    if status_:
        stmt = stmt.where(Deposit.status == status_)
    return list(await session.scalars(stmt))


@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(campaign_id: uuid.UUID, _: AdminUser, session: DbSession, force: bool = False):
    """Permanently delete an ad. Ads with recorded interactions need force=true (history is removed)."""
    c = await session.get(Campaign, campaign_id)
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Campaign not found")
    n = await session.scalar(select(func.count(Interaction.id)).where(Interaction.campaign_id == c.id))
    if n and not force:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"This ad has {n} recorded interaction(s). Hide it instead, or confirm to delete it with its history.",
        )
    await session.execute(delete(Interaction).where(Interaction.campaign_id == c.id))
    await session.delete(c)
    await session.commit()
    await cache.invalidate("campaigns:live", "analytics:*")
