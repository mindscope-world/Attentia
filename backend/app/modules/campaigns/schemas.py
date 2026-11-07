import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.campaigns.models import CampaignStatus


class CampaignBase(BaseModel):
    name: str = Field(max_length=200)
    brand: str = Field(max_length=120)
    category: str = Field(max_length=64)
    description: str
    objective: str | None = None
    is_demo: bool = True
    asset_id: uuid.UUID | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    daily_interaction_limit: int = Field(default=1000, gt=0)
    reward_rate: Decimal = Field(gt=0)
    budget_total: Decimal = Field(gt=0)
    min_watch_pct: float = Field(default=0.9, ge=0, le=1)
    display_seconds: int = Field(default=15, ge=1, le=600)
    requires_feedback: bool = False
    rating_prompt: str = Field(max_length=300)
    question: str = Field(max_length=300)
    options: list[str] = Field(min_length=2, max_length=8)
    correct_option: str | None = None
    targeting: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def _check(self):
        if self.correct_option is not None and self.correct_option not in self.options:
            raise ValueError("correct_option must be one of options")
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        return self


class CampaignIn(CampaignBase):
    pass


class CampaignUpdateIn(BaseModel):
    name: str | None = None
    brand: str | None = None
    category: str | None = None
    description: str | None = None
    objective: str | None = None
    is_demo: bool | None = None
    asset_id: uuid.UUID | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    daily_interaction_limit: int | None = Field(default=None, gt=0)
    reward_rate: Decimal | None = Field(default=None, gt=0)
    budget_total: Decimal | None = Field(default=None, gt=0)
    min_watch_pct: float | None = Field(default=None, ge=0, le=1)
    display_seconds: int | None = Field(default=None, ge=1, le=600)
    requires_feedback: bool | None = None
    rating_prompt: str | None = None
    question: str | None = None
    options: list[str] | None = None
    correct_option: str | None = None
    targeting: dict | None = None


class CampaignStatusIn(BaseModel):
    status: CampaignStatus


class CampaignOut(BaseModel):
    """Full campaign view for advertisers/admins."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    advertiser_id: uuid.UUID | None
    asset_id: uuid.UUID | None
    name: str
    brand: str
    category: str
    description: str
    objective: str | None
    is_demo: bool
    status: CampaignStatus
    starts_at: datetime | None
    ends_at: datetime | None
    daily_interaction_limit: int
    reward_rate: Decimal
    budget_total: Decimal
    budget_spent: Decimal
    min_watch_pct: float
    display_seconds: int
    requires_feedback: bool
    rating_prompt: str
    question: str
    options: list[str]
    correct_option: str | None
    targeting: dict
    created_at: datetime


class FeedItem(BaseModel):
    """What a participant sees for an available task (no answer key, no budget)."""

    id: uuid.UUID
    name: str
    brand: str
    category: str
    description: str
    is_demo: bool
    reward: Decimal
    duration_seconds: float | None
    media_url: str | None
    thumbnail_url: str | None
    min_watch_pct: float
    requires_feedback: bool
    rating_prompt: str
    question: str
    options: list[str]
    completed_today: bool


class FeedOut(BaseModel):
    package: str | None
    daily_quota: int
    completed_today: int
    remaining_quota: int
    items: list[FeedItem]
