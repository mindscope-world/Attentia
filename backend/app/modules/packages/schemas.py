import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.packages.models import SubscriptionStatus


class PackageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    price: Decimal
    daily_quota: int
    duration_days: int
    min_withdrawal: Decimal
    withdrawal_fee_pct: Decimal
    description: str | None
    is_active: bool


class PackageIn(BaseModel):
    code: str = Field(min_length=2, max_length=32, pattern=r"^[a-z0-9_-]+$")
    name: str = Field(max_length=64)
    price: Decimal = Field(gt=0)
    daily_quota: int = Field(gt=0)
    duration_days: int = Field(default=365, gt=0)
    min_withdrawal: Decimal = Field(ge=0)
    withdrawal_fee_pct: Decimal = Field(ge=0, lt=1)
    description: str | None = None
    is_active: bool = True
    sort_order: int = 0


class PackageUpdateIn(BaseModel):
    name: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    daily_quota: int | None = Field(default=None, gt=0)
    duration_days: int | None = Field(default=None, gt=0)
    min_withdrawal: Decimal | None = Field(default=None, ge=0)
    withdrawal_fee_pct: Decimal | None = Field(default=None, ge=0, lt=1)
    description: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: SubscriptionStatus
    activated_at: datetime | None
    expires_at: datetime | None
    package: PackageOut
