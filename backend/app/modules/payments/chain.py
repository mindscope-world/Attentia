"""Blockchain integration seams.

`AddressProvider` hands out a unique deposit address per deposit. `ChainMonitor` reports what
the chain has seen for an address. Production implementations (HD-wallet xpub derivation /
custody provider API, and RPC-provider monitors per network) plug in here; private keys are
never stored by this service. The development implementations below are deterministic and
driven by the `/payments/deposits/{id}/simulate` endpoint.
"""

import hashlib
import hmac
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from app.core.config import settings
from app.modules.payments.models import Deposit, Network

B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


class AddressProvider(Protocol):
    def address_for(self, network: Network, index: int) -> str: ...


class ChainMonitor(Protocol):
    def observe(self, deposit: Deposit) -> "Observation | None": ...


@dataclass
class Observation:
    tx_hash: str
    amount: Decimal
    confirmations: int


class DevAddressProvider:
    """Deterministic, format-valid addresses derived from an HMAC of (network, index)."""

    def address_for(self, network: Network, index: int) -> str:
        digest = hmac.new(
            settings.address_derivation_secret.encode(), f"{network.value}:{index}".encode(), hashlib.sha256
        ).digest()
        if network == Network.trc20:
            n = int.from_bytes(digest, "big")
            chars = []
            while len(chars) < 33:
                n, r = divmod(n, 58)
                chars.append(B58[r])
            return "T" + "".join(chars)
        return "0x" + digest[:20].hex()


class DevChainMonitor:
    """Simulated chain: once a payment is simulated, each scan adds a few confirmations."""

    step = 4

    def observe(self, deposit: Deposit) -> Observation | None:
        if not deposit.tx_hash or deposit.received_amount is None:
            return None
        return Observation(
            tx_hash=deposit.tx_hash,
            amount=Decimal(deposit.received_amount),
            confirmations=min(deposit.confirmations + self.step, deposit.required_confirmations),
        )


address_provider: AddressProvider = DevAddressProvider()
chain_monitor: ChainMonitor = DevChainMonitor()

ADDRESS_PATTERNS = {
    Network.trc20: r"^T[1-9A-HJ-NP-Za-km-z]{33}$",
    Network.erc20: r"^0x[0-9a-fA-F]{40}$",
    Network.polygon: r"^0x[0-9a-fA-F]{40}$",
}

EXPLORERS = {
    Network.trc20: "https://tronscan.org/#/transaction/{}",
    Network.erc20: "https://etherscan.io/tx/{}",
    Network.polygon: "https://polygonscan.com/tx/{}",
}
