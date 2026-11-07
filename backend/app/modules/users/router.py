import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.security import create_access_token
from app.modules.users.deps import AdminUser, CurrentUser, DbSession
from app.modules.users.models import User
from app.modules.users.schemas import (
    AdminUserUpdateIn,
    LoginIn,
    RegisterIn,
    TokenOut,
    UserOut,
    UserUpdateIn,
)
from app.modules.users.service import UserExistsError, authenticate, create_user

auth_router = APIRouter(prefix="/auth", tags=["auth"])
users_router = APIRouter(prefix="/users", tags=["users"])


def _token_for(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(str(user.id), user.role.value),
        user=UserOut.model_validate(user),
    )


@auth_router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, session: DbSession) -> TokenOut:
    try:
        user = await create_user(
            session,
            email=body.email,
            password=body.password,
            username=body.username,
            full_name=body.full_name,
        )
    except UserExistsError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))
    await session.commit()
    return _token_for(user)


@auth_router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, session: DbSession) -> TokenOut:
    user = await authenticate(session, body.identifier, body.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username/email or password.")
    return _token_for(user)


@users_router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user


@users_router.patch("/me", response_model=UserOut)
async def update_me(body: UserUpdateIn, user: CurrentUser, session: DbSession) -> User:
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await session.commit()
    return user


@users_router.get("", response_model=list[UserOut])
async def list_users(_: AdminUser, session: DbSession, limit: int = 100, offset: int = 0) -> list[User]:
    rows = await session.scalars(
        select(User).order_by(User.created_at.desc()).limit(min(limit, 500)).offset(offset)
    )
    return list(rows)


@users_router.patch("/{user_id}", response_model=UserOut)
async def admin_update_user(
    user_id: uuid.UUID, body: AdminUserUpdateIn, _: AdminUser, session: DbSession
) -> User:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await session.commit()
    return user
