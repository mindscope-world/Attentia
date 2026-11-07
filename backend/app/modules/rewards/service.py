"""Ledger posting and balance queries.

Posting functions take a *sync* Session so the same code runs in Celery workers and,
via `AsyncSession.run_sync`, inside API requests.
"""

import uuid
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.rewards.models import EntryType, LedgerAccount, LedgerEntry

CENT = Decimal("0.01")


def q2(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def post(
    session: Session,
    *,
    user_id: uuid.UUID,
    entry_type: EntryType,
    reference_type: str,
    reference_id: uuid.UUID,
    legs: list[tuple[LedgerAccount, Decimal]],
    description: str | None = None,
) -> uuid.UUID:
    """Post one ledger transaction made of one or more legs (account, signed amount)."""
    txn = uuid.uuid4()
    for account, amount in legs:
        session.add(
            LedgerEntry(
                transaction_id=txn,
                user_id=user_id,
                account=account,
                entry_type=entry_type,
                amount=amount,
                reference_type=reference_type,
                reference_id=reference_id,
                description=description,
            )
        )
    session.flush()
    return txn


def calculate_reward(reward_rate: Decimal) -> Decimal:
    """Participant reward for one verified interaction, net of the platform fee."""
    return q2(reward_rate * (Decimal(1) - settings.platform_fee_pct))


def credit_reward(
    session: Session, *, user_id: uuid.UUID, interaction_id: uuid.UUID, amount: Decimal, description: str
) -> uuid.UUID:
    return post(
        session,
        user_id=user_id,
        entry_type=EntryType.reward,
        reference_type="interaction",
        reference_id=interaction_id,
        legs=[(LedgerAccount.rewards, amount)],
        description=description,
    )


def balances_stmt(user_id: uuid.UUID) -> Select:
    return (
        select(LedgerEntry.account, func.coalesce(func.sum(LedgerEntry.amount), 0))
        .where(LedgerEntry.user_id == user_id)
        .group_by(LedgerEntry.account)
    )


def to_balances(rows) -> dict[str, Decimal]:
    out = {a.value: Decimal("0") for a in LedgerAccount}
    for account, total in rows:
        out[LedgerAccount(account).value] = q2(Decimal(total))
    return out


def sync_balances(session: Session, user_id: uuid.UUID) -> dict[str, Decimal]:
    return to_balances(session.execute(balances_stmt(user_id)).all())


def lock_user(session: Session, user_id: uuid.UUID) -> None:
    """Serialize balance-changing operations per user (SELECT … FOR UPDATE on the user row)."""
    from app.modules.users.models import User

    session.execute(select(User.id).where(User.id == user_id).with_for_update())
