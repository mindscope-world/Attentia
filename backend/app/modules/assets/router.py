import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.core import storage
from app.core.config import settings
from app.modules.assets.models import Asset, AssetKind, AssetStatus
from app.modules.assets.tasks import process_asset
from app.modules.users.deps import AdvertiserOrAdmin, DbSession
from app.modules.users.models import Role, User

router = APIRouter(prefix="/assets", tags=["assets"])

ALLOWED_TYPES = {
    "video/mp4": AssetKind.video,
    "video/quicktime": AssetKind.video,
    "video/webm": AssetKind.video,
    "image/jpeg": AssetKind.image,
    "image/png": AssetKind.image,
    "image/webp": AssetKind.image,
}


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: AssetKind
    status: AssetStatus
    original_filename: str | None
    duration_seconds: float | None
    width: int | None
    height: int | None
    size_bytes: int | None
    error: str | None
    created_at: datetime
    media_url: str | None = None
    thumbnail_url: str | None = None


class UploadRequestIn(BaseModel):
    filename: str = Field(max_length=255)
    content_type: str


class UploadRequestOut(BaseModel):
    asset: AssetOut
    upload_url: str
    method: str = "PUT"
    headers: dict[str, str]


def asset_out(asset: Asset) -> AssetOut:
    out = AssetOut.model_validate(asset)
    if asset.status == AssetStatus.ready:
        out.media_url = storage.presigned_get(asset.media_key)
        out.thumbnail_url = storage.presigned_get(asset.thumbnail_key)
    return out


def _kind_for(content_type: str) -> AssetKind:
    kind = ALLOWED_TYPES.get(content_type)
    if kind is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported type {content_type}")
    return kind


async def _get_owned(session, asset_id: uuid.UUID, user: User) -> Asset:
    asset = await session.get(Asset, asset_id)
    if asset is None or (user.role != Role.admin and asset.owner_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    return asset


@router.post("/upload", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
async def upload_asset(file: UploadFile, user: AdvertiserOrAdmin, session: DbSession) -> AssetOut:
    """Direct multipart upload through the API, then queue processing."""
    content_type = file.content_type or "application/octet-stream"
    kind = _kind_for(content_type)
    if file.size is not None and file.size > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    asset = Asset(
        id=uuid.uuid4(),
        owner_id=user.id,
        kind=kind,
        original_filename=file.filename,
        content_type=content_type,
        original_key="",
    )
    asset.original_key = f"uploads/{asset.id}/original"
    await run_in_threadpool(storage.upload_fileobj, file.file, asset.original_key, content_type)
    asset.status = AssetStatus.uploaded
    session.add(asset)
    await session.commit()
    process_asset.delay(str(asset.id))
    return asset_out(asset)


@router.post("/upload-url", response_model=UploadRequestOut, status_code=status.HTTP_201_CREATED)
async def request_upload_url(body: UploadRequestIn, user: AdvertiserOrAdmin, session: DbSession):
    """Presigned direct-to-storage upload for large creatives. Call /complete afterwards."""
    kind = _kind_for(body.content_type)
    asset_id = uuid.uuid4()
    asset = Asset(
        id=asset_id,
        owner_id=user.id,
        kind=kind,
        original_filename=body.filename,
        content_type=body.content_type,
        original_key=f"uploads/{asset_id}/original",
    )
    session.add(asset)
    await session.commit()
    url = storage.presigned_put(asset.original_key, body.content_type)
    return UploadRequestOut(asset=asset_out(asset), upload_url=url, headers={"Content-Type": body.content_type})


@router.post("/{asset_id}/complete", response_model=AssetOut)
async def complete_upload(asset_id: uuid.UUID, user: AdvertiserOrAdmin, session: DbSession) -> AssetOut:
    asset = await _get_owned(session, asset_id, user)
    if asset.status != AssetStatus.awaiting_upload:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Asset is already {asset.status}")
    if not await run_in_threadpool(storage.object_exists, asset.original_key):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Upload not found in storage")
    asset.status = AssetStatus.uploaded
    await session.commit()
    process_asset.delay(str(asset.id))
    return asset_out(asset)


@router.post("/{asset_id}/reprocess", response_model=AssetOut)
async def reprocess(asset_id: uuid.UUID, user: AdvertiserOrAdmin, session: DbSession) -> AssetOut:
    asset = await _get_owned(session, asset_id, user)
    if asset.status in (AssetStatus.awaiting_upload, AssetStatus.processing):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Asset is {asset.status}")
    asset.status = AssetStatus.uploaded
    await session.commit()
    process_asset.delay(str(asset.id))
    return asset_out(asset)


@router.get("", response_model=list[AssetOut])
async def list_assets(user: AdvertiserOrAdmin, session: DbSession) -> list[AssetOut]:
    q = select(Asset).order_by(Asset.created_at.desc()).limit(200)
    if user.role != Role.admin:
        q = q.where(Asset.owner_id == user.id)
    return [asset_out(a) for a in await session.scalars(q)]


@router.get("/{asset_id}", response_model=AssetOut)
async def get_asset(asset_id: uuid.UUID, user: AdvertiserOrAdmin, session: DbSession) -> AssetOut:
    return asset_out(await _get_owned(session, asset_id, user))
