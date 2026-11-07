import enum
import uuid
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, IdMixin, TimestampMixin


class LedgerAccount(enum.StrEnum):
    """Per-user sub-accounts. A user's balance in each = SUM(amount) of their entries."""

    deposits = "deposits"  # funds received on-chain, not yet applied
    rewards = "rewards"  # verified earnings; the withdrawable balance
    pending_withdrawal = "pending_withdrawal"  # reserved for an in-flight payout
    withdrawn = "withdrawn"  # net amounts paid out
    fees = "fees"  # platform fees charged to the user
    packages = "packages"  # amounts applied to package purchases


class EntryType(enum.StrEnum):
    reward = "reward"
    deposit = "deposit"
    package_purchase = "package_purchase"
    withdrawal_request = "withdrawal_request"
    withdrawal_complete = "withdrawal_complete"
    withdrawal_reversal = "withdrawal_reversal"
    adjustment = "adjustment"


class LedgerEntry(IdMixin, TimestampMixin, Base):
    """Append-only. Never update or delete rows; post a reversing entry instead."""

    __tablename__ = "ledger_entries"
    __table_args__ = (
        # Idempotency: the same business event can only post once per account.
        UniqueConstraint("entry_type", "reference_id", "account", name="uq_ledger_event_account"),
    )

    transaction_id: Mapped[uuid.UUID] = mapped_column(index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    account: Mapped[LedgerAccount] = mapped_column(Enum(LedgerAccount, name="ledger_account"))
    entry_type: Mapped[EntryType] = mapped_column(Enum(EntryType, name="ledger_entry_type"))
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    reference_type: Mapped[str] = mapped_column(String(32))
    reference_id: Mapped[uuid.UUID]
    description: Mapped[str | None] = mapped_column(String(300))
