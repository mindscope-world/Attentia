"""Import every module's models so SQLAlchemy metadata (and Alembic) sees all tables."""

from app.modules.assets.models import Asset  # noqa: F401
from app.modules.campaigns.models import Campaign  # noqa: F401
from app.modules.packages.models import Package, Subscription  # noqa: F401
from app.modules.payments.models import Deposit, Withdrawal  # noqa: F401
from app.modules.rewards.models import LedgerEntry  # noqa: F401
from app.modules.users.models import User  # noqa: F401
from app.modules.verification.models import Interaction  # noqa: F401
