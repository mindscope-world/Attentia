import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, IdMixin, TimestampMixin


class Network(enum.StrEnum):
    trc20 = "TRC-20"
    erc20 = "ERC-20"
    polygon = "POLYGON"


# Supported asset per network (proposal §8)
NETWORK_ASSET = {Network.trc20: "USDT", Network.erc20: "USDT", Network.polygon: "USDC"}


class DepositStatus(enum.StrEnum):
    awaiting_payment = "awaiting_payment"
    pending = "pending"  # seen on-chain, waiting for confirmations
    confirmed = "confirmed"
    underpaid = "underpaid"
    expired = "expired"
    failed = "failed"


class Deposit(IdMixin, TimestampMixin, Base):
    __tablename__ = "deposits"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    subscription_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("subscriptions.id"))
    network: Mapped[Network] = mapped_column(Enum(Network, name="network", values_callable=lambda e: [m.value for m in e]))
    asset: Mapped[str] = mapped_column(String(16))
    address: Mapped[str] = mapped_column(String(128), unique=True)
    derivation_index: Mapped[int] = mapped_column(Integer)
    expected_amount: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    received_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    tx_hash: Mapped[str | None] = mapped_column(String(128), unique=True)
    confirmations: Mapped[int] = mapped_column(Integer, default=0)
    required_confirmations: Mapped[int] = mapped_column(Integer)
    status: Mapped[DepositStatus] = mapped_column(
        Enum(DepositStatus, name="deposit_status"), default=DepositStatus.awaiting_payment, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class WithdrawalStatus(enum.StrEnum):
    requested = "requested"
    completed = "completed"
    rejected = "rejected"


class Withdrawal(IdMixin, TimestampMixin, Base):
    __tablename__ = "withdrawals"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    network: Mapped[Network] = mapped_column(Enum(Network, name="network", values_callable=lambda e: [m.value for m in e]))
    asset: Mapped[str] = mapped_column(String(16))
    address: Mapped[str] = mapped_column(String(128))
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    fee: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    net_amount: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    status: Mapped[WithdrawalStatus] = mapped_column(
        Enum(WithdrawalStatus, name="withdrawal_status"), default=WithdrawalStatus.requested, index=True
    )
    tx_hash: Mapped[str | None] = mapped_column(String(128))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(String(300))
