import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.modules.packages.models import Package
from app.modules.packages.schemas import PackageIn, PackageOut, PackageUpdateIn, SubscriptionOut
from app.modules.packages.service import active_subscription
from app.modules.users.deps import AdminUser, CurrentUser, DbSession

router = APIRouter(prefix="/packages", tags=["packages"])


@router.get("", response_model=list[PackageOut])
async def list_packages(session: DbSession, include_inactive: bool = False) -> list[Package]:
    q = select(Package).order_by(Package.sort_order, Package.price)
    if not include_inactive:
        q = q.where(Package.is_active.is_(True))
    return list(await session.scalars(q))


@router.get("/subscription", response_model=SubscriptionOut | None)
async def my_subscription(user: CurrentUser, session: DbSession):
    return await active_subscription(session, user.id)


@router.post("", response_model=PackageOut, status_code=status.HTTP_201_CREATED)
async def create_package(body: PackageIn, _: AdminUser, session: DbSession) -> Package:
    if await session.scalar(select(Package.id).where(Package.code == body.code)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Package code already exists")
    pkg = Package(**body.model_dump())
    session.add(pkg)
    await session.commit()
    return pkg


@router.patch("/{package_id}", response_model=PackageOut)
async def update_package(
    package_id: uuid.UUID, body: PackageUpdateIn, _: AdminUser, session: DbSession
) -> Package:
    pkg = await session.get(Package, package_id)
    if pkg is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(pkg, field, value)
    await session.commit()
    return pkg
