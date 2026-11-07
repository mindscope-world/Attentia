import logging
import tempfile
import uuid
from pathlib import Path

from app.core import storage
from app.core.celery_app import celery_app
from app.core.db import SyncSessionLocal
from app.modules.assets import pipeline
from app.modules.assets.models import Asset, AssetKind, AssetStatus

log = logging.getLogger(__name__)


def process_asset_sync(asset_id: uuid.UUID) -> AssetStatus:
    with SyncSessionLocal() as session:
        asset = session.get(Asset, asset_id)
        if asset is None:
            raise ValueError(f"Asset {asset_id} not found")
        asset.status = AssetStatus.processing
        asset.error = None
        session.commit()

        try:
            with tempfile.TemporaryDirectory() as tmp:
                tmpdir = Path(tmp)
                src = tmpdir / "source"
                storage.download_file(asset.original_key, src)
                asset.size_bytes = src.stat().st_size
                info = pipeline.probe(src)
                prefix = f"assets/{asset.id}"
                thumb = tmpdir / "thumb.jpg"

                if asset.kind == AssetKind.video:
                    out = tmpdir / "video.mp4"
                    pipeline.transcode_video(src, out, info)
                    out_info = pipeline.probe(out)
                    at = min(1.0, (out_info.duration or 0) / 2)
                    pipeline.make_thumbnail(out, thumb, at)
                    storage.upload_file(out, f"{prefix}/video.mp4", "video/mp4")
                    asset.media_key = f"{prefix}/video.mp4"
                    asset.duration_seconds = out_info.duration
                    asset.width, asset.height = out_info.width, out_info.height
                else:
                    out = tmpdir / "image.webp"
                    pipeline.convert_image(src, out)
                    pipeline.make_thumbnail(src, thumb, 0)
                    storage.upload_file(out, f"{prefix}/image.webp", "image/webp")
                    asset.media_key = f"{prefix}/image.webp"
                    asset.width, asset.height = info.width, info.height

                storage.upload_file(thumb, f"{prefix}/thumb.jpg", "image/jpeg")
                asset.thumbnail_key = f"{prefix}/thumb.jpg"
                asset.status = AssetStatus.ready
        except Exception as e:  # noqa: BLE001 — record any pipeline failure on the asset
            log.exception("Asset %s processing failed", asset_id)
            asset.status = AssetStatus.failed
            asset.error = str(e)[:2000]
        session.commit()
        return asset.status


@celery_app.task(name="assets.process", bind=True, max_retries=2, default_retry_delay=30)
def process_asset(self, asset_id: str) -> str:
    return process_asset_sync(uuid.UUID(asset_id)).value
