import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select

from app.modules.rewards.models import EntryType, LedgerAccount, LedgerEntry
from app.modules.rewards.service import balances_stmt, to_balances
from app.modules.users.deps import CurrentUser, DbSession

router = APIRouter(prefix="/rewards", tags=["rewards"])


class BalancesOut(BaseModel):
    available: Decimal
    pending_withdrawal: Decimal
    total_earned: Decimal
    withdrawn: Decimal
    deposits: Decimal
    accounts: dict[str, Decimal]


class LedgerEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    transaction_id: uuid.UUID
    account: LedgerAccount
    entry_type: EntryType
    amount: Decimal
    reference_type: str
    reference_id: uuid.UUID
    description: str | None
    created_at: datetime


@router.get("/balances", response_model=BalancesOut)
async def balances(user: CurrentUser, session: DbSession) -> BalancesOut:
    accounts = to_balances((await session.execute(balances_stmt(user.id))).all())
    total = await session.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.user_id == user.id,
            LedgerEntry.entry_type == EntryType.reward,
        )
    )
    total = Decimal(total)
    return BalancesOut(
        available=accounts[LedgerAccount.rewards],
        pending_withdrawal=accounts[LedgerAccount.pending_withdrawal],
        total_earned=total.quantize(Decimal("0.01")),
        withdrawn=accounts[LedgerAccount.withdrawn],
        deposits=accounts[LedgerAccount.deposits],
        accounts=accounts,
    )


@router.get("/ledger", response_model=list[LedgerEntryOut])
async def ledger(user: CurrentUser, session: DbSession, limit: int = 100, offset: int = 0):
    rows = await session.scalars(
        select(LedgerEntry)
        .where(LedgerEntry.user_id == user.id)
        .order_by(LedgerEntry.created_at.desc())
        .limit(min(limit, 500))
        .offset(offset)
    )
    return list(rows)
