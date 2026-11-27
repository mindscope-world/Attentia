"""Finds candidate ad videos on YouTube (Data API v3). Needs YOUTUBE_API_KEY."""

import random
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.modules.assets.youtube import parse_iso_duration

API = "https://www.googleapis.com/youtube/v3"
CATEGORIES = [
    "Technology", "Financial Services", "Consumer Goods", "Telecommunications", "E-commerce",
    "Education", "Automotive", "Travel", "Food & Beverage", "Health & Fitness",
]
PHRASES = ["official TV commercial", "official advert", "brand commercial", "ad campaign film"]
MIN_SECONDS, MAX_SECONDS = 6, 180
MAX_PER_CATEGORY = 4
MAX_SEARCHES = 14
PAGES_PER_QUERY = 3
TIMEOUT = httpx.Timeout(15.0)


class DiscoveryError(Exception):
    def __init__(self, message: str, code: int = 502):
        super().__init__(message)
        self.code = code


@dataclass
class Found:
    youtube_id: str
    title: str
    channel_title: str
    description: str
    thumbnail_url: str
    duration_seconds: float
    category: str


async def _get(client: httpx.AsyncClient, path: str, params: dict) -> dict:
    r = await client.get(f"{API}/{path}", params={**params, "key": settings.youtube_api_key})
    if r.status_code == 403:
        raise DiscoveryError("YouTube API quota exceeded or the key is not allowed to use the Data API", 502)
    if r.status_code != 200:
        raise DiscoveryError(f"YouTube Data API error ({r.status_code})", 502)
    return r.json()


async def _details(client: httpx.AsyncClient, ids: list[str]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for i in range(0, len(ids), 50):
        data = await _get(
            client, "videos", {"id": ",".join(ids[i : i + 50]), "part": "snippet,contentDetails,status", "maxResults": 50}
        )
        out.update({it["id"]: it for it in data.get("items", [])})
    return out


def _acceptable(item: dict) -> float | None:
    st = item.get("status", {})
    if not st.get("embeddable") or st.get("privacyStatus") != "public" or st.get("uploadStatus") != "processed":
        return None
    seconds = parse_iso_duration(item.get("contentDetails", {}).get("duration", ""))
    if seconds is None or not (MIN_SECONDS <= seconds <= MAX_SECONDS):
        return None
    return seconds


async def discover(target: int, exclude: set[str]) -> list[Found]:
    """Return up to `target` new, embeddable ad videos whose IDs are not in `exclude`."""
    if not settings.youtube_api_key:
        raise DiscoveryError(
            "Fetching ads needs a YouTube Data API key. Set YOUTUBE_API_KEY in .env and restart the API.", 503
        )
    seen = set(exclude)
    found: list[Found] = []
    per_category: dict[str, int] = {}
    categories = random.sample(CATEGORIES, len(CATEGORIES))
    searches = 0
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            # Round-robin over categories so one fetch spans several industries.
            while len(found) < target and searches < MAX_SEARCHES:
                progressed = False
                for category in categories:
                    if len(found) >= target or searches >= MAX_SEARCHES:
                        break
                    if per_category.get(category, 0) >= MAX_PER_CATEGORY:
                        continue
                    q = f"{category} {random.choice(PHRASES)}"
                    token = None
                    for _ in range(PAGES_PER_QUERY):
                        params = {
                            "part": "snippet", "type": "video", "q": q, "maxResults": 25,
                            "videoEmbeddable": "true", "videoSyndicated": "true", "safeSearch": "strict",
                            "videoDuration": "short",
                        }
                        if token:
                            params["pageToken"] = token
                        data = await _get(client, "search", params)
                        searches += 1
                        ids = [it["id"]["videoId"] for it in data.get("items", []) if it.get("id", {}).get("videoId")]
                        ids = [i for i in dict.fromkeys(ids) if i not in seen]
                        seen.update(ids)
                        for vid, item in (await _details(client, ids)).items():
                            seconds = _acceptable(item)
                            if seconds is None or per_category.get(category, 0) >= MAX_PER_CATEGORY:
                                continue
                            sn = item.get("snippet", {})
                            thumbs = sn.get("thumbnails", {})
                            found.append(
                                Found(
                                    youtube_id=vid,
                                    title=sn.get("title", "")[:300],
                                    channel_title=sn.get("channelTitle", "")[:200],
                                    description=(sn.get("description") or "")[:500],
                                    thumbnail_url=(thumbs.get("high") or thumbs.get("default") or {}).get("url")
                                    or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                                    duration_seconds=seconds,
                                    category=category,
                                )
                            )
                            per_category[category] = per_category.get(category, 0) + 1
                            progressed = True
                            if len(found) >= target:
                                break
                        token = data.get("nextPageToken")
                        if not token or len(found) >= target or searches >= MAX_SEARCHES:
                            break
                if not progressed:
                    break
    except httpx.HTTPError as e:
        raise DiscoveryError(f"Could not reach YouTube: {e}", 502) from e
    return found
