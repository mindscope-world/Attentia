"""FFmpeg processing for ad creatives.

Video target (proposal §5.2): MP4, H.264 video, AAC audio, 16:9, 360p–720p, faststart for
progressive playback, plus a JPG thumbnail. Images are normalised to WebP + a JPG thumbnail.
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


def target_height(src_height: int) -> int:
    if src_height < settings.video_min_height:
        raise MediaError(
            f"Video resolution {src_height}p is below the {settings.video_min_height}p minimum"
        )
    return min(src_height, settings.video_max_height) // 2 * 2


def transcode_video(src: Path, dst: Path, info: ProbeResult) -> None:
    h = target_height(info.height)
    w = h * 16 // 9 // 2 * 2
    # Fit inside a 16:9 frame and letterbox/pillarbox the rest.
    vf = (
        f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30"
    )
    args = [settings.ffmpeg_bin, "-y", "-i", str(src)]
    if not info.has_audio:
        # Every output gets an AAC track so players behave consistently.
        args += ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-shortest"]
    args += [
        "-map", "0:v:0", "-map", "0:a:0" if info.has_audio else "1:a:0",
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "main", "-pix_fmt", "yuv420p", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k", "-ac", "2",
        "-movflags", "+faststart",
        str(dst),
    ]
    _run(args)


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
