from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.modules.users.models import Role, User


class UserExistsError(Exception):
    pass


def _derive_username(email: str) -> str:
    return email.split("@", 1)[0].lower()[:48]


async def create_user(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    username: str | None = None,
    full_name: str | None = None,
    role: Role = Role.participant,
) -> User:
    email = email.strip().lower()
    base = (username or _derive_username(email)).strip().lower()

    existing = await session.scalar(select(User).where(User.email == email))
    if existing:
        raise UserExistsError("An account with this email already exists")

    candidate = base
    if username is None:
        # Auto-derived usernames get a numeric suffix on collision.
        n = 1
        while await session.scalar(select(User.id).where(User.username == candidate)):
            n += 1
            candidate = f"{base}{n}"
    elif await session.scalar(select(User.id).where(User.username == candidate)):
        raise UserExistsError("This username is taken")

    user = User(
        email=email,
        username=candidate,
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
    )
    session.add(user)
    await session.flush()
    return user


async def authenticate(session: AsyncSession, identifier: str, password: str) -> User | None:
    ident = identifier.strip().lower()
    user = await session.scalar(
        select(User).where(or_(func.lower(User.email) == ident, User.username == ident))
    )
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        return None
    return user
