import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, computed_field
from sqlalchemy import select

from app.core import cache
from app.core.config import settings
from app.modules.payments import service
from app.modules.payments.chain import EXPLORERS
from app.modules.payments.models import Deposit, DepositStatus, Network, Withdrawal, WithdrawalStatus
from app.modules.users.deps import AdminUser, CurrentUser, DbSession

router = APIRouter(prefix="/payments", tags=["payments"])


class DepositIn(BaseModel):
    package_id: uuid.UUID
    network: Network


class SimulateIn(BaseModel):
    amount: Decimal = Field(gt=0)
    tx_hash: str | None = Field(default=None, max_length=128)


class DepositOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    network: Network
    asset: str
    address: str
    expected_amount: Decimal
    received_amount: Decimal | None
    tx_hash: str | None
    confirmations: int
    required_confirmations: int
    status: DepositStatus
    expires_at: datetime
    confirmed_at: datetime | None
    created_at: datetime

    @computed_field
    @property
    def explorer_url(self) -> str | None:
        return EXPLORERS[self.network].format(self.tx_hash) if self.tx_hash else None


class WithdrawalIn(BaseModel):
    amount: Decimal = Field(gt=0)
    network: Network
    address: str = Field(max_length=128)


class WithdrawalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    network: Network
    asset: str
    address: str
    amount: Decimal
    fee: Decimal
    net_amount: Decimal
    status: WithdrawalStatus
    tx_hash: str | None
    rejection_reason: str | None
    created_at: datetime
    reviewed_at: datetime | None

    @computed_field
    @property
    def explorer_url(self) -> str | None:
        return EXPLORERS[self.network].format(self.tx_hash) if self.tx_hash else None


class ApproveIn(BaseModel):
    tx_hash: str = Field(min_length=8, max_length=128)


class RejectIn(BaseModel):
    reason: str = Field(min_length=3, max_length=300)


def _raise(e: service.PaymentError):
    raise HTTPException(e.code, str(e))


async def _run(session, fn):
    try:
        result = await session.run_sync(fn)
    except service.PaymentError as e:
        await session.rollback()
        _raise(e)
    await session.commit()
    await cache.invalidate("analytics:*")
    return result


# ---------------------------------------------------------------- deposits


@router.post("/deposits", response_model=DepositOut, status_code=status.HTTP_201_CREATED)
async def create_deposit(body: DepositIn, user: CurrentUser, session: DbSession):
    return await _run(
        session, lambda s: service.create_deposit(s, user_id=user.id, package_id=body.package_id, network=body.network)
    )


@router.get("/deposits", response_model=list[DepositOut])
async def my_deposits(user: CurrentUser, session: DbSession):
    return list(
        await session.scalars(select(Deposit).where(Deposit.user_id == user.id).order_by(Deposit.created_at.desc()))
    )


@router.get("/deposits/{deposit_id}", response_model=DepositOut)
async def get_deposit(deposit_id: uuid.UUID, user: CurrentUser, session: DbSession):
    d = await session.get(Deposit, deposit_id)
    if d is None or d.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deposit not found")
    return d


@router.post("/deposits/{deposit_id}/simulate", response_model=DepositOut)
async def simulate_deposit(deposit_id: uuid.UUID, body: SimulateIn, user: CurrentUser, session: DbSession):
    """Development only: pretend a transfer to the deposit address was broadcast."""
    if not settings.is_dev:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    d = await session.get(Deposit, deposit_id, with_for_update=True)
    if d is None or d.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deposit not found")
    return await _run(session, lambda s: service.simulate_payment(s, d, body.amount, body.tx_hash))


# ---------------------------------------------------------------- withdrawals


@router.post("/withdrawals", response_model=WithdrawalOut, status_code=status.HTTP_201_CREATED)
async def request_withdrawal(body: WithdrawalIn, user: CurrentUser, session: DbSession):
    return await _run(
        session,
        lambda s: service.request_withdrawal(
            s, user=s.merge(user), amount=body.amount, network=body.network, address=body.address
        ),
    )


@router.get("/withdrawals", response_model=list[WithdrawalOut])
async def my_withdrawals(user: CurrentUser, session: DbSession):
    return list(
        await session.scalars(
            select(Withdrawal).where(Withdrawal.user_id == user.id).order_by(Withdrawal.created_at.desc())
        )
    )


@router.get("/admin/withdrawals", response_model=list[WithdrawalOut])
async def all_withdrawals(_: AdminUser, session: DbSession, status_: WithdrawalStatus | None = None):
    q = select(Withdrawal).order_by(Withdrawal.created_at.desc()).limit(500)
    if status_:
        q = q.where(Withdrawal.status == status_)
    return list(await session.scalars(q))


async def _get_withdrawal(session, wid: uuid.UUID) -> Withdrawal:
    w = await session.get(Withdrawal, wid, with_for_update=True)
    if w is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Withdrawal not found")
    return w


@router.post("/admin/withdrawals/{withdrawal_id}/approve", response_model=WithdrawalOut)
async def approve_withdrawal(withdrawal_id: uuid.UUID, body: ApproveIn, admin: AdminUser, session: DbSession):
    w = await _get_withdrawal(session, withdrawal_id)
    return await _run(session, lambda s: service.complete_withdrawal(s, w, reviewer_id=admin.id, tx_hash=body.tx_hash))


@router.post("/admin/withdrawals/{withdrawal_id}/reject", response_model=WithdrawalOut)
async def reject_withdrawal(withdrawal_id: uuid.UUID, body: RejectIn, admin: AdminUser, session: DbSession):
    w = await _get_withdrawal(session, withdrawal_id)
    return await _run(session, lambda s: service.reject_withdrawal(s, w, reviewer_id=admin.id, reason=body.reason))
