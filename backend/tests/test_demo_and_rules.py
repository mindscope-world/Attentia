from app.modules.assets import youtube


async def test_seeded_demo_content_is_youtube_and_labelled(client, demo):
    items = (await client.get("/campaigns/feed", headers=demo)).json()["items"]
    assert 10 <= len(items) <= 20
    assert all(i["is_demo"] and i["media_kind"] == "youtube" and i["youtube_id"] for i in items)
    industries = {i["category"] for i in items}
    assert len(industries) >= 8
    assert {"Technology", "Financial Services", "Consumer Goods", "Telecommunications", "E-commerce", "Education"} <= industries
    # the old fictional, video-less campaigns are not served
    assert not any(i["name"].startswith("Lumio") for i in items)


async def test_campaign_defaults_follow_the_30s_rule(client, admin):
    body = {
        "name": "Defaults", "brand": "B", "category": "Technology", "description": "d", "reward_rate": "0.40",
        "budget_total": "10", "rating_prompt": "r", "question": "q", "options": ["a", "b"],
    }
    r = await client.post("/campaigns", json=body, headers=admin)
    assert r.status_code == 201, r.text
    assert r.json()["display_seconds"] == 30
    assert r.json()["min_watch_pct"] == 0.97


async def _youtube_campaign(client, admin, monkeypatch, seconds: float) -> str:
    async def fake_fetch(video_id):
        return youtube.YouTubeVideo(video_id=video_id, title="T", duration_seconds=seconds)

    monkeypatch.setattr(youtube, "fetch_video", fake_fetch)
    asset = (await client.post("/assets/youtube", json={"url": "aqz-KE-bpKQ"}, headers=admin)).json()
    body = {
        "name": f"YT {seconds}", "brand": "B", "category": "Technology", "description": "d", "reward_rate": "0.40",
        "budget_total": "10", "rating_prompt": "r", "question": "q", "options": ["a", "b"], "asset_id": asset["id"],
    }
    cid = (await client.post("/campaigns", json=body, headers=admin)).json()["id"]
    assert (await client.post(f"/campaigns/{cid}/status", json={"status": "active"}, headers=admin)).status_code == 200
    return cid


async def test_long_videos_never_require_more_than_29s(client, admin, demo, monkeypatch):
    cid = await _youtube_campaign(client, admin, monkeypatch, 600.0)
    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    assert it["required_seconds"] == 29.0


async def test_short_videos_require_97pct_of_their_length(client, admin, demo, monkeypatch):
    cid = await _youtube_campaign(client, admin, monkeypatch, 20.0)
    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    assert it["required_seconds"] == 19.4


async def test_change_password(client, demo):
    bad = await client.post("/users/me/password", json={"current_password": "wrong", "new_password": "new-password-1"}, headers=demo)
    assert bad.status_code == 400
    ok = await client.post("/users/me/password", json={"current_password": "demo-password", "new_password": "new-password-1"}, headers=demo)
    assert ok.status_code == 204
    assert (await client.post("/auth/login", json={"identifier": "demo", "password": "demo-password"})).status_code == 401
    assert (await client.post("/auth/login", json={"identifier": "demo", "password": "new-password-1"})).status_code == 200


async def test_30s_rule_overrides_a_low_campaign_percentage(client, admin, demo, monkeypatch):
    cid = await _youtube_campaign(client, admin, monkeypatch, 600.0)
    r = await client.patch(f"/campaigns/{cid}", json={"min_watch_pct": 0.5}, headers=admin)
    assert r.status_code == 200
    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    assert it["required_seconds"] == 29.0  # not 300


async def test_started_but_unsubmitted_task_stays_available_and_resumes(client, demo):
    items = (await client.get("/campaigns/feed", headers=demo)).json()["items"]
    cid = items[0]["id"]
    first = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    again = (await client.get("/campaigns/feed", headers=demo)).json()["items"]
    assert next(i for i in again if i["id"] == cid)["completed_today"] is False
    resumed = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    assert resumed["id"] == first["id"]
