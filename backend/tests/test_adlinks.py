import pytest

from app.core.config import settings
from app.modules.adlinks import discovery
from app.modules.adlinks.discovery import Found


def _vid(n: int) -> str:
    return f"vid{n:08d}"[-11:].ljust(11, "x")


def _fake_found(start: int, n: int) -> list[Found]:
    return [
        Found(_vid(i), f"Ad {i}", f"Brand {i}", "desc", "http://t/x.jpg", 30.0, "Technology") for i in range(start, start + n)
    ]


@pytest.fixture
def fake_discover(monkeypatch):
    state = {"next": 0, "seen_exclude": None}

    async def fake(target, exclude):
        state["seen_exclude"] = set(exclude)
        out = [f for f in _fake_found(state["next"], target + 5) if f.youtube_id not in exclude][:target]
        state["next"] += target
        return out

    monkeypatch.setattr(discovery, "discover", fake)
    return state


async def test_requires_admin(client, demo):
    assert (await client.get("/admin/ad-links", headers=demo)).status_code == 403
    assert (await client.post("/admin/ad-links/fetch", json={}, headers=demo)).status_code == 403


async def test_fetch_without_api_key_explains(client, admin, monkeypatch):
    monkeypatch.setattr(settings, "youtube_api_key", "")
    r = await client.post("/admin/ad-links/fetch", json={}, headers=admin)
    assert r.status_code == 503 and "YOUTUBE_API_KEY" in r.json()["detail"]


async def test_fetch_stores_20_and_never_repeats(client, admin, fake_discover):
    r = await client.post("/admin/ad-links/fetch", json={}, headers=admin)
    assert r.status_code == 200, r.text
    assert r.json()["added"] == 20
    assert all(i["status"] == "pending" for i in r.json()["items"])
    first = {i["youtube_id"] for i in r.json()["items"]}
    r2 = await client.post("/admin/ad-links/fetch", json={}, headers=admin)
    assert first <= fake_discover["seen_exclude"]  # stored links are excluded from the next search
    assert not first & {i["youtube_id"] for i in r2.json()["items"]}
    assert len((await client.get("/admin/ad-links", headers=admin)).json()) >= 40


async def test_approve_pause_decline_flow(client, admin, demo, fake_discover):
    items = (await client.post("/admin/ad-links/fetch", json={"count": 3}, headers=admin)).json()["items"]
    a, b, c = (i["id"] for i in items)

    r = await client.post(f"/admin/ad-links/{a}/approve", json={"reward_rate": "0.40", "budget_total": "50"}, headers=admin)
    assert r.status_code == 200 and r.json()["status"] == "active" and r.json()["campaign_id"]
    feed = (await client.get("/campaigns/feed", headers=demo)).json()["items"]
    assert any(i["name"] == items[0]["title"] for i in feed)

    r = await client.post(f"/admin/ad-links/{b}/pause", headers=admin)
    assert r.json()["status"] == "paused"
    feed = (await client.get("/campaigns/feed", headers=demo)).json()["items"]
    assert not any(i["name"] == items[1]["title"] for i in feed)

    r = await client.post(f"/admin/ad-links/{c}/decline", headers=admin)
    assert r.json()["status"] == "declined" and r.json()["campaign_id"] is None
    assert (await client.post(f"/admin/ad-links/{c}/approve", headers=admin)).status_code == 409

    # declined links stay stored (never fetched again); approved ones follow the campaign when it is hidden
    assert any(i["id"] == c for i in (await client.get("/admin/ad-links?status_=declined", headers=admin)).json())
    cid = (await client.get("/admin/ad-links?status_=active", headers=admin)).json()[0]["campaign_id"]
    await client.post(f"/campaigns/{cid}/status", json={"status": "paused"}, headers=admin)
    assert any(i["id"] == a for i in (await client.get("/admin/ad-links?status_=paused", headers=admin)).json())
    # deleting the campaign from the Ads list keeps the link, marked removed
    await client.delete(f"/admin/campaigns/{cid}", headers=admin)
    assert any(i["id"] == a for i in (await client.get("/admin/ad-links?status_=removed", headers=admin)).json())


async def test_existing_youtube_ads_are_backfilled(client, admin, monkeypatch):
    from app.modules.assets import youtube

    async def fake_fetch(video_id):
        return youtube.YouTubeVideo(video_id=video_id, title="Manual ad", duration_seconds=20.0)

    monkeypatch.setattr(youtube, "fetch_video", fake_fetch)
    asset = (await client.post("/assets/youtube", json={"url": "aqz-KE-bpKQ"}, headers=admin)).json()
    assert asset["youtube_id"] == "aqz-KE-bpKQ"
    links = (await client.get("/admin/ad-links", headers=admin)).json()
    link = next(l for l in links if l["youtube_id"] == "aqz-KE-bpKQ")
    assert link["source"] == "existing"


async def test_discovery_filters_and_spreads(monkeypatch):
    monkeypatch.setattr(settings, "youtube_api_key", "k")
    counter = {"n": 0}

    async def fake_get(client, path, params):
        if path == "search":
            base = counter["n"] * 25
            counter["n"] += 1
            return {"items": [{"id": {"videoId": _vid(base + i)}} for i in range(25)], "nextPageToken": "t"}
        items = []
        for idx, vid in enumerate(params["id"].split(",")):
            items.append(
                {
                    "id": vid,
                    "snippet": {"title": vid, "channelTitle": "C", "description": "d", "thumbnails": {}},
                    "contentDetails": {"duration": "PT1M" if idx % 5 else "PT20M"},  # every 5th is too long
                    "status": {"embeddable": idx % 7 != 0, "privacyStatus": "public", "uploadStatus": "processed"},
                }
            )
        return {"items": items}

    monkeypatch.setattr(discovery, "_get", fake_get)
    found = await discovery.discover(20, set())
    assert len(found) == 20
    assert len({f.youtube_id for f in found}) == 20
    assert all(f.duration_seconds == 60 for f in found)
    assert len({f.category for f in found}) >= 5  # at most MAX_PER_CATEGORY from any one industry
