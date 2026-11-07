import re
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.packages.models import Package, Subscription, SubscriptionStatus
from app.modules.packages.service import activate_subscription
from app.modules.payments.chain import ADDRESS_PATTERNS, address_provider, chain_monitor
from app.modules.payments.models import (
    NETWORK_ASSET,
    Deposit,
    DepositStatus,
    Network,
    Withdrawal,
    WithdrawalStatus,
)
from app.modules.rewards.models import EntryType, LedgerAccount
from app.modules.rewards.service import lock_user, post, q2, sync_balances
from app.modules.users.models import KycStatus, User


class PaymentError(Exception):
    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.code = code


# ---------------------------------------------------------------- deposits


def create_deposit(session: Session, *, user_id: uuid.UUID, package_id: uuid.UUID, network: Network) -> Deposit:
    package = session.get(Package, package_id)
    if package is None or not package.is_active:
        raise PaymentError("Package not available", 404)

    sub = Subscription(user_id=user_id, package_id=package.id, status=SubscriptionStatus.pending_payment)
    session.add(sub)
    session.flush()

    # Serialise index allocation so every deposit gets a unique address.
    session.execute(select(func.pg_advisory_xact_lock(4201)))
    index = (session.scalar(select(func.max(Deposit.derivation_index))) or 0) + 1
    deposit = Deposit(
        user_id=user_id,
        subscription_id=sub.id,
        network=network,
        asset=NETWORK_ASSET[network],
        address=address_provider.address_for(network, index),
        derivation_index=index,
        expected_amount=package.price,
        required_confirmations=settings.deposit_required_confirmations,
        expires_at=datetime.now(UTC) + timedelta(minutes=settings.deposit_expiry_minutes),
    )
    session.add(deposit)
    session.flush()
    return deposit


def simulate_payment(session: Session, deposit: Deposit, amount: Decimal, tx_hash: str | None) -> Deposit:
    if deposit.status != DepositStatus.awaiting_payment:
        raise PaymentError(f"Deposit is {deposit.status}", 409)
    deposit.tx_hash = tx_hash or uuid.uuid4().hex + uuid.uuid4().hex
    deposit.received_amount = amount
    deposit.status = DepositStatus.pending
    session.flush()
    return deposit


def apply_observation(session: Session, deposit: Deposit) -> Deposit:
    """Advance one pending deposit using the chain monitor; confirm when final."""
    obs = chain_monitor.observe(deposit)
    if obs is None:
        return deposit
    deposit.tx_hash = obs.tx_hash
    deposit.received_amount = obs.amount
    deposit.confirmations = obs.confirmations
    if deposit.status == DepositStatus.awaiting_payment:
        deposit.status = DepositStatus.pending
    if deposit.confirmations >= deposit.required_confirmations:
        _finalise(session, deposit)
    session.flush()
    return deposit


def _finalise(session: Session, deposit: Deposit) -> None:
    lock_user(session, deposit.user_id)
    received = Decimal(deposit.received_amount)
    expected = Decimal(deposit.expected_amount)
    post(
        session,
        user_id=deposit.user_id,
        entry_type=EntryType.deposit,
        reference_type="deposit",
        reference_id=deposit.id,
        legs=[(LedgerAccount.deposits, received)],
        description=f"{deposit.asset} {deposit.network.value} deposit {deposit.tx_hash}",
    )
    deposit.confirmed_at = datetime.now(UTC)
    if received + Decimal("0.000001") < expected:
        # Funds stay in the deposits account for support to resolve.
        deposit.status = DepositStatus.underpaid
        return

    deposit.status = DepositStatus.confirmed
    sub = session.get(Subscription, deposit.subscription_id) if deposit.subscription_id else None
    if sub is not None:
        post(
            session,
            user_id=deposit.user_id,
            entry_type=EntryType.package_purchase,
            reference_type="subscription",
            reference_id=sub.id,
            legs=[(LedgerAccount.deposits, -expected), (LedgerAccount.packages, expected)],
            description="Participation package activation",
        )
        activate_subscription(session, sub)


def scan_pending(session: Session) -> int:
    rows = session.scalars(
        select(Deposit)
        .where(Deposit.status.in_([DepositStatus.awaiting_payment, DepositStatus.pending]))
        .with_for_update(skip_locked=True)
    ).all()
    for d in rows:
        apply_observation(session, d)
    return len(rows)


def expire_stale(session: Session) -> int:
    now = datetime.now(UTC)
    rows = session.scalars(
        select(Deposit).where(Deposit.status == DepositStatus.awaiting_payment, Deposit.expires_at <= now)
    ).all()
    for d in rows:
        d.status = DepositStatus.expired
        if d.subscription_id:
            sub = session.get(Subscription, d.subscription_id)
            if sub and sub.status == SubscriptionStatus.pending_payment:
                sub.status = SubscriptionStatus.cancelled
    session.flush()
    return len(rows)


# ---------------------------------------------------------------- withdrawals


def request_withdrawal(
    session: Session, *, user: User, amount: Decimal, network: Network, address: str
) -> Withdrawal:
    if user.kyc_status != KycStatus.verified:
        raise PaymentError("Identity verification is required before withdrawing", 403)
    if not re.match(ADDRESS_PATTERNS[network], address):
        raise PaymentError(f"Invalid {network.value} address")

    lock_user(session, user.id)
    from app.modules.verification.service import daily_quota

    sub, _, _ = daily_quota(session, user.id)
    if sub is None:
        raise PaymentError("An active participation package is required", 403)
    pkg = sub.package
    amount = q2(amount)
    if amount < pkg.min_withdrawal:
        raise PaymentError(f"Minimum withdrawal for {pkg.name} is ${pkg.min_withdrawal}")
    available = sync_balances(session, user.id)[LedgerAccount.rewards]
    if amount > available:
        raise PaymentError(f"Insufficient available balance (${available})")

    fee = q2(amount * Decimal(pkg.withdrawal_fee_pct))
    w = Withdrawal(
        user_id=user.id,
        network=network,
        asset=NETWORK_ASSET[network],
        address=address,
        amount=amount,
        fee=fee,
        net_amount=amount - fee,
    )
    session.add(w)
    session.flush()
    post(
        session,
        user_id=user.id,
        entry_type=EntryType.withdrawal_request,
        reference_type="withdrawal",
        reference_id=w.id,
        legs=[(LedgerAccount.rewards, -amount), (LedgerAccount.pending_withdrawal, amount)],
        description=f"Withdrawal request to {network.value} {address}",
    )
    return w


def complete_withdrawal(session: Session, w: Withdrawal, *, reviewer_id: uuid.UUID, tx_hash: str) -> Withdrawal:
    if w.status != WithdrawalStatus.requested:
        raise PaymentError(f"Withdrawal is {w.status}", 409)
    lock_user(session, w.user_id)
    post(
        session,
        user_id=w.user_id,
        entry_type=EntryType.withdrawal_complete,
        reference_type="withdrawal",
        reference_id=w.id,
        legs=[
            (LedgerAccount.pending_withdrawal, -Decimal(w.amount)),
            (LedgerAccount.withdrawn, Decimal(w.net_amount)),
            (LedgerAccount.fees, Decimal(w.fee)),
        ],
        description=f"Payout {tx_hash}",
    )
    w.status = WithdrawalStatus.completed
    w.tx_hash = tx_hash
    w.reviewed_by = reviewer_id
    w.reviewed_at = datetime.now(UTC)
    session.flush()
    return w


def reject_withdrawal(session: Session, w: Withdrawal, *, reviewer_id: uuid.UUID, reason: str) -> Withdrawal:
    if w.status != WithdrawalStatus.requested:
        raise PaymentError(f"Withdrawal is {w.status}", 409)
    lock_user(session, w.user_id)
    post(
        session,
        user_id=w.user_id,
        entry_type=EntryType.withdrawal_reversal,
        reference_type="withdrawal",
        reference_id=w.id,
        legs=[(LedgerAccount.pending_withdrawal, -Decimal(w.amount)), (LedgerAccount.rewards, Decimal(w.amount))],
        description=f"Withdrawal rejected: {reason}",
    )
    w.status = WithdrawalStatus.rejected
    w.rejection_reason = reason
    w.reviewed_by = reviewer_id
    w.reviewed_at = datetime.now(UTC)
    session.flush()
    return w
