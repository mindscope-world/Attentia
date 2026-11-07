"""YouTube-hosted ad creatives.

Advertisers register a YouTube video by URL instead of uploading a file. Nothing is downloaded
or transcoded: participants watch it through the embedded YouTube IFrame player, which reports
playback positions to the verification module like the native player does.

Metadata comes from the YouTube Data API when ``YOUTUBE_API_KEY`` is set (title, duration,
embeddability). Without a key we fall back to oEmbed, which confirms the video exists and is
embeddable but does not report duration, so the advertiser must supply it.
"""

import re
from dataclasses import dataclass

import httpx

from app.core.config import settings

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
_URL_PATTERNS = [
    re.compile(r"(?:youtube\.com|youtube-nocookie\.com)/(?:embed|shorts|live|v)/([A-Za-z0-9_-]{11})"),
    re.compile(r"youtube\.com/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})"),
    re.compile(r"youtu\.be/([A-Za-z0-9_-]{11})"),
]
_ISO_DURATION_RE = re.compile(r"^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$")
TIMEOUT = httpx.Timeout(10.0)


class YouTubeError(Exception):
    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.code = code


@dataclass
class YouTubeVideo:
    video_id: str
    title: str | None
    duration_seconds: float | None


def parse_video_id(value: str) -> str:
    """Accept a bare 11-character ID or any common YouTube URL form."""
    value = value.strip()
    if VIDEO_ID_RE.match(value):
        return value
    for pattern in _URL_PATTERNS:
        if m := pattern.search(value):
            return m.group(1)
    raise YouTubeError("Not a recognisable YouTube video URL or ID")


def parse_iso_duration(value: str) -> float | None:
    m = _ISO_DURATION_RE.match(value or "")
    if not m:
        return None
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return float(((d * 24 + h) * 60 + mi) * 60 + s) or None


def watch_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def embed_url(video_id: str) -> str:
    # Privacy-enhanced host: no tracking cookies until the participant presses play.
    return f"https://www.youtube-nocookie.com/embed/{video_id}"


def thumbnail_url(video_id: str) -> str:
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"


async def _from_data_api(client: httpx.AsyncClient, video_id: str) -> YouTubeVideo:
    r = await client.get(
        "https://www.googleapis.com/youtube/v3/videos",
        params={"id": video_id, "part": "snippet,contentDetails,status", "key": settings.youtube_api_key},
    )
    if r.status_code != 200:
        raise YouTubeError(f"YouTube Data API error ({r.status_code})", 502)
    items = r.json().get("items") or []
    if not items:
        raise YouTubeError("YouTube video not found or private", 404)
    item = items[0]
    st = item.get("status", {})
    if not st.get("embeddable", True):
        raise YouTubeError("The owner of this YouTube video has disabled embedding")
    if st.get("privacyStatus") == "private":
        raise YouTubeError("YouTube video is private")
    return YouTubeVideo(
        video_id=video_id,
        title=item.get("snippet", {}).get("title"),
        duration_seconds=parse_iso_duration(item.get("contentDetails", {}).get("duration", "")),
    )


async def _from_oembed(client: httpx.AsyncClient, video_id: str) -> YouTubeVideo:
    r = await client.get("https://www.youtube.com/oembed", params={"url": watch_url(video_id), "format": "json"})
    if r.status_code == 401:
        raise YouTubeError("The owner of this YouTube video has disabled embedding")
    if r.status_code in (400, 403, 404):
        raise YouTubeError("YouTube video not found or private", 404)
    if r.status_code != 200:
        raise YouTubeError(f"YouTube oEmbed error ({r.status_code})", 502)
    return YouTubeVideo(video_id=video_id, title=r.json().get("title"), duration_seconds=None)


async def fetch_video(video_id: str) -> YouTubeVideo:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            if settings.youtube_api_key:
                return await _from_data_api(client, video_id)
            return await _from_oembed(client, video_id)
    except httpx.HTTPError as e:
        raise YouTubeError(f"Could not reach YouTube: {e}", 502) from e
