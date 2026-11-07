"""FFmpeg processing for uploaded image creatives: normalised to WebP plus a JPG thumbnail.

Video ads are not processed here; they are embedded from YouTube (see youtube.py).
"""

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


class MediaError(Exception):
    pass


@dataclass
class ProbeResult:
    duration: float | None
    width: int
    height: int
    has_audio: bool


def _run(args: list[str], timeout: int = 600) -> subprocess.CompletedProcess:
    proc = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        raise MediaError(proc.stderr.strip()[-2000:] or f"{args[0]} exited with {proc.returncode}")
    return proc


def probe(path: Path) -> ProbeResult:
    out = _run(
        [settings.ffprobe_bin, "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)]
    ).stdout
    data = json.loads(out)
    streams = data.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    if video is None:
        raise MediaError("No video/image stream found")
    duration = data.get("format", {}).get("duration")
    return ProbeResult(
        duration=float(duration) if duration not in (None, "N/A") else None,
        width=int(video["width"]),
        height=int(video["height"]),
        has_audio=any(s.get("codec_type") == "audio" for s in streams),
    )


def make_thumbnail(src: Path, dst: Path, at_seconds: float = 1.0) -> None:
    _run(
        [
            settings.ffmpeg_bin, "-y", "-ss", f"{at_seconds:.2f}", "-i", str(src),
            "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "3", str(dst),
        ]
    )


def convert_image(src: Path, dst_webp: Path) -> None:
    _run(
        [
            settings.ffmpeg_bin, "-y", "-i", str(src),
            "-vf", "scale='min(1280,iw)':-2", "-c:v", "libwebp", "-quality", "85", str(dst_webp),
        ]
    )
