import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.users.models import KycStatus, Role


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    username: str | None = Field(default=None, min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    full_name: str | None = Field(default=None, max_length=200)


class LoginIn(BaseModel):
    identifier: str = Field(description="Email address or username")
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    username: str
    full_name: str | None
    role: Role
    kyc_status: KycStatus
    two_factor_enabled: bool
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)


class AdminUserUpdateIn(BaseModel):
    role: Role | None = None
    kyc_status: KycStatus | None = None
    is_active: bool | None = None
