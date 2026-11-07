import asyncio
import subprocess
import uuid
from decimal import Decimal

import httpx

from app.core.db import SyncSessionLocal
from app.modules.payments.service import scan_pending

QUICK_CAMPAIGN = {
    "name": "Quick test spot",
    "brand": "TestCo (Demo)",
    "category": "Technology",
    "description": "Fictional test creative",
    "reward_rate": "0.40",
    "budget_total": "0.80",
    "display_seconds": 1,
    "min_watch_pct": 1.0,
    "rating_prompt": "Rate it",
    "question": "What was shown?",
    "options": ["A phone", "A car"],
    "correct_option": "A phone",
}


async def _quick_campaign(client, admin, **overrides) -> str:
    r = await client.post("/campaigns", json={**QUICK_CAMPAIGN, **overrides}, headers=admin)
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    r = await client.post(f"/campaigns/{cid}/status", json={"status": "active"}, headers=admin)
    assert r.status_code == 200, r.text
    return cid


# ------------------------------------------------------------------ users / auth


async def test_health(client):
    r = await client.get("/health")
    assert r.json() == {"status": "ok", "database": True, "redis": True, "storage": True}


async def test_register_login_and_me(client):
    r = await client.post("/auth/register", json={"email": "new@example.com", "password": "longpassword"})
    assert r.status_code == 201
    assert r.json()["user"]["username"] == "new"
    assert (await client.post("/auth/register", json={"email": "new@example.com", "password": "longpassword"})).status_code == 409

    r = await client.post("/auth/login", json={"identifier": "new", "password": "wrong-password"})
    assert r.status_code == 401
    r = await client.post("/auth/login", json={"identifier": "NEW@example.com", "password": "longpassword"})
    token = r.json()["access_token"]
    me = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["role"] == "participant"
    assert (await client.get("/users/me")).status_code == 401


async def test_role_permissions(client, demo, admin):
    assert (await client.get("/users", headers=demo)).status_code == 403
    assert (await client.get("/users", headers=admin)).status_code == 200
    assert (await client.post("/campaigns", json=QUICK_CAMPAIGN, headers=demo)).status_code == 403
    assert (await client.get("/analytics/admin", headers=demo)).status_code == 403


# ------------------------------------------------------------------ packages


async def test_packages_admin_configurable(client, admin, demo):
    pkgs = (await client.get("/packages")).json()
    assert [p["code"] for p in pkgs] == ["starter", "growth", "pro"]
    growth = next(p for p in pkgs if p["code"] == "growth")
    r = await client.patch(f"/packages/{growth['id']}", json={"daily_quota": 42}, headers=admin)
    assert r.json()["daily_quota"] == 42
    sub = (await client.get("/packages/subscription", headers=demo)).json()
    assert sub["package"]["daily_quota"] == 42


# ------------------------------------------------------------------ verification + rewards


async def test_verified_task_credits_ledger_once(client, admin, demo):
    cid = await _quick_campaign(client, admin)
    feed = (await client.get("/campaigns/feed", headers=demo)).json()
    item = next(i for i in feed["items"] if i["id"] == cid)
    assert "correct_option" not in item and item["reward"] == "0.40"

    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    await asyncio.sleep(1.1)
    r = await client.post(f"/interactions/{it['id']}/submit", json={"rating": 5, "answer": "A phone"}, headers=demo)
    body = r.json()
    assert body["status"] == "verified", body
    assert Decimal(body["reward_amount"]) == Decimal("0.40")

    bal = (await client.get("/rewards/balances", headers=demo)).json()
    assert Decimal(bal["available"]) == Decimal("0.40")
    assert Decimal(bal["total_earned"]) == Decimal("0.40")

    # Duplicate prevention: same campaign, same day.
    r = await client.post("/interactions", json={"campaign_id": cid}, headers=demo)
    assert r.status_code == 409
    r = await client.post(f"/interactions/{it['id']}/submit", json={"rating": 5, "answer": "A phone"}, headers=demo)
    assert r.status_code == 409

    feed = (await client.get("/campaigns/feed", headers=demo)).json()
    assert feed["completed_today"] == 1
    assert next(i for i in feed["items"] if i["id"] == cid)["completed_today"] is True


async def test_early_or_wrong_submission_rejected(client, admin, demo):
    cid = await _quick_campaign(client, admin, display_seconds=30)
    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    r = await client.post(f"/interactions/{it['id']}/submit", json={"rating": 3, "answer": "A phone"}, headers=demo)
    assert r.json()["status"] == "rejected"
    assert "viewing is required" in r.json()["rejection_reason"]

    cid2 = await _quick_campaign(client, admin, name="Second")
    it2 = (await client.post("/interactions", json={"campaign_id": cid2}, headers=demo)).json()
    await asyncio.sleep(1.1)
    r = await client.post(f"/interactions/{it2['id']}/submit", json={"rating": 3, "answer": "A car"}, headers=demo)
    assert r.json()["rejection_reason"] == "Comprehension check failed"
    bal = (await client.get("/rewards/balances", headers=demo)).json()
    assert Decimal(bal["available"]) == 0


async def test_forward_seek_earns_no_watch_time(client, admin, demo):
    cid = await _quick_campaign(client, admin)
    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    r = await client.post(
        f"/interactions/{it['id']}/events",
        json={"events": [{"type": "play", "position": 0}, {"type": "progress", "position": 30}]},
        headers=demo,
    )
    assert r.json()["watched_seconds"] == 0


async def test_budget_exhaustion_and_status_sync(client, admin, demo):
    from app.modules.campaigns.tasks import sync_status_sync

    # Budget 0.80 at 0.40/interaction covers exactly two verified views.
    cid = await _quick_campaign(client, admin)
    users = [demo]
    for n in range(2):
        r = await client.post("/auth/register", json={"email": f"p{n}@example.com", "password": "longpassword"})
        users.append({"Authorization": f"Bearer {r.json()['access_token']}"})

    # Only the demo user has a package; others are refused.
    r = await client.post("/interactions", json={"campaign_id": cid}, headers=users[1])
    assert r.status_code == 403

    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    await asyncio.sleep(1.1)
    await client.post(f"/interactions/{it['id']}/submit", json={"rating": 4, "answer": "A phone"}, headers=demo)
    c = (await client.get(f"/campaigns/{cid}", headers=admin)).json()
    assert Decimal(c["budget_spent"]) == Decimal("0.40")

    await client.patch(f"/campaigns/{cid}", json={"budget_total": "0.40"}, headers=admin)
    assert sync_status_sync()["completed"] == 1
    feed = (await client.get("/campaigns/feed", headers=demo)).json()
    assert cid not in [i["id"] for i in feed["items"]]


# ------------------------------------------------------------------ payments


async def test_deposit_flow_activates_package(client):
    r = await client.post("/auth/register", json={"email": "payer@example.com", "password": "longpassword"})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    pro = next(p for p in (await client.get("/packages")).json() if p["code"] == "pro")

    d1 = (await client.post("/payments/deposits", json={"package_id": pro["id"], "network": "TRC-20"}, headers=h)).json()
    d2 = (await client.post("/payments/deposits", json={"package_id": pro["id"], "network": "TRC-20"}, headers=h)).json()
    assert d1["address"] != d2["address"] and d1["address"].startswith("T") and len(d1["address"]) == 34
    assert d1["asset"] == "USDT" and d1["required_confirmations"] == 12

    r = await client.post(f"/payments/deposits/{d1['id']}/simulate", json={"amount": "500"}, headers=h)
    assert r.json()["status"] == "pending"
    for _ in range(3):
        with SyncSessionLocal() as s:
            scan_pending(s)
            s.commit()
    d = (await client.get(f"/payments/deposits/{d1['id']}", headers=h)).json()
    assert d["status"] == "confirmed" and d["confirmations"] == 12
    assert d["explorer_url"].startswith("https://tronscan.org")

    sub = (await client.get("/packages/subscription", headers=h)).json()
    assert sub["package"]["code"] == "pro" and sub["status"] == "active"
    bal = (await client.get("/rewards/balances", headers=h)).json()
    assert Decimal(bal["deposits"]) == 0 and Decimal(bal["accounts"]["packages"]) == 500


async def test_underpaid_deposit(client):
    r = await client.post("/auth/register", json={"email": "under@example.com", "password": "longpassword"})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    starter = next(p for p in (await client.get("/packages")).json() if p["code"] == "starter")
    d = (await client.post("/payments/deposits", json={"package_id": starter["id"], "network": "POLYGON"}, headers=h)).json()
    assert d["asset"] == "USDC"
    await client.post(f"/payments/deposits/{d['id']}/simulate", json={"amount": "20"}, headers=h)
    for _ in range(3):
        with SyncSessionLocal() as s:
            scan_pending(s)
            s.commit()
    assert (await client.get(f"/payments/deposits/{d['id']}", headers=h)).json()["status"] == "underpaid"
    assert (await client.get("/packages/subscription", headers=h)).json() is None


async def test_withdrawal_lifecycle(client, admin, demo):
    from app.modules.rewards.models import EntryType, LedgerAccount
    from app.modules.rewards.service import post
    from app.modules.users.models import User
    from sqlalchemy import select

    with SyncSessionLocal() as s:
        uid = s.scalar(select(User.id).where(User.username == "demo"))
        post(s, user_id=uid, entry_type=EntryType.adjustment, reference_type="test", reference_id=uuid.uuid4(),
             legs=[(LedgerAccount.rewards, Decimal("100"))])
        s.commit()

    addr = "0x" + "ab" * 20
    r = await client.post("/payments/withdrawals", json={"amount": "10", "network": "ERC-20", "address": addr}, headers=demo)
    assert r.status_code == 400 and "Minimum" in r.json()["detail"]
    r = await client.post("/payments/withdrawals", json={"amount": "30", "network": "ERC-20", "address": "bad"}, headers=demo)
    assert r.status_code == 400
    r = await client.post("/payments/withdrawals", json={"amount": "40", "network": "ERC-20", "address": addr}, headers=demo)
    w = r.json()
    assert Decimal(w["fee"]) == Decimal("0.60") and Decimal(w["net_amount"]) == Decimal("39.40")
    bal = (await client.get("/rewards/balances", headers=demo)).json()
    assert Decimal(bal["available"]) == 60 and Decimal(bal["pending_withdrawal"]) == 40

    r = await client.post("/payments/withdrawals", json={"amount": "70", "network": "ERC-20", "address": addr}, headers=demo)
    assert "Insufficient" in r.json()["detail"]

    r = await client.post(f"/payments/admin/withdrawals/{w['id']}/approve", json={"tx_hash": "0x" + "1" * 64}, headers=admin)
    assert r.json()["status"] == "completed"
    bal = (await client.get("/rewards/balances", headers=demo)).json()
    assert Decimal(bal["pending_withdrawal"]) == 0 and Decimal(bal["withdrawn"]) == Decimal("39.40")

    w2 = (await client.post("/payments/withdrawals", json={"amount": "25", "network": "ERC-20", "address": addr}, headers=demo)).json()
    await client.post(f"/payments/admin/withdrawals/{w2['id']}/reject", json={"reason": "Test reversal"}, headers=admin)
    bal = (await client.get("/rewards/balances", headers=demo)).json()
    assert Decimal(bal["available"]) == 60

    ledger = (await client.get("/rewards/ledger", headers=demo)).json()
    assert {e["entry_type"] for e in ledger} >= {"withdrawal_request", "withdrawal_complete", "withdrawal_reversal"}


async def test_withdrawal_requires_kyc(client):
    r = await client.post("/auth/register", json={"email": "nokyc@example.com", "password": "longpassword"})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = await client.post("/payments/withdrawals", json={"amount": "30", "network": "ERC-20", "address": "0x" + "ab" * 20}, headers=h)
    assert r.status_code == 403


# ------------------------------------------------------------------ assets / ffmpeg / storage


async def test_video_file_uploads_are_rejected(client, admin):
    r = await client.post("/assets/upload", files={"file": ("ad.mp4", b"\x00" * 64, "video/mp4")}, headers=admin)
    assert r.status_code == 415 and "YouTube" in r.json()["detail"]
    r = await client.post("/assets/upload-url", json={"filename": "ad.webm", "content_type": "video/webm"},
                          headers=admin)
    assert r.status_code == 415



async def test_presigned_upload_flow(client, advertiser, tmp_path):
    src = tmp_path / "pic.png"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=size=800x450", "-frames:v", "1", str(src)], check=True)
    r = await client.post("/assets/upload-url", json={"filename": "pic.png", "content_type": "image/png"}, headers=advertiser)
    req = r.json()
    async with httpx.AsyncClient() as raw:
        put = await raw.put(req["upload_url"], content=src.read_bytes(), headers=req["headers"])
    assert put.status_code == 200, put.text
    r = await client.post(f"/assets/{req['asset']['id']}/complete", headers=advertiser)
    asset = (await client.get(f"/assets/{r.json()['id']}", headers=advertiser)).json()
    assert asset["status"] == "ready" and asset["kind"] == "image"


# ------------------------------------------------------------------ analytics + cache


async def test_analytics(client, admin, demo):
    cid = await _quick_campaign(client, admin)
    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    await asyncio.sleep(1.1)
    await client.post(f"/interactions/{it['id']}/submit", json={"rating": 4, "answer": "A phone", "feedback": "Clear and short"}, headers=demo)

    me = (await client.get("/analytics/me", headers=demo)).json()
    assert me["verified_tasks"] == 1 and me["average_rating_given"] == 4.0
    camp = (await client.get(f"/analytics/campaigns/{cid}", headers=admin)).json()
    assert camp["verified_views"] == 1 and camp["completion_rate"] == 1.0
    assert camp["cost_per_verified_interaction"] == 0.4 and camp["answer_distribution"] == {"A phone": 1}
    adm = (await client.get("/analytics/admin", headers=admin)).json()
    assert adm["verified_tasks"] == 1 and adm["reward_liabilities"] == 0.4

    from app.core.cache import get_redis

    assert await get_redis().exists("analytics:admin")


# ------------------------------------------------------------------ youtube creatives


def test_youtube_id_parsing():
    from app.modules.assets.youtube import YouTubeError, parse_iso_duration, parse_video_id

    vid = "dQw4w9WgXcQ"
    for url in (
        vid,
        f"https://www.youtube.com/watch?v={vid}",
        f"https://youtube.com/watch?feature=share&v={vid}&t=10s",
        f"https://youtu.be/{vid}?si=abc",
        f"https://www.youtube.com/embed/{vid}",
        f"https://www.youtube-nocookie.com/embed/{vid}",
        f"https://youtube.com/shorts/{vid}",
    ):
        assert parse_video_id(url) == vid, url
    for bad in ("https://vimeo.com/123", "not a url", "https://youtube.com/watch?v=short"):
        try:
            parse_video_id(bad)
            raise AssertionError(bad)
        except YouTubeError:
            pass
    assert parse_iso_duration("PT1M5S") == 65 and parse_iso_duration("PT2H") == 7200
    assert parse_iso_duration("P0D") is None


async def test_youtube_asset_campaign_and_watch_accounting(client, admin, demo, monkeypatch):
    from app.modules.assets import youtube

    async def fake_fetch(video_id):
        return youtube.YouTubeVideo(video_id=video_id, title="Launch spot", duration_seconds=None)

    monkeypatch.setattr(youtube, "fetch_video", fake_fetch)

    r = await client.post("/assets/youtube", json={"url": "https://youtu.be/dQw4w9WgXcQ"}, headers=admin)
    assert r.status_code == 422 and "duration_seconds" in r.text  # no API key -> duration needed

    r = await client.post(
        "/assets/youtube", json={"url": "https://youtu.be/dQw4w9WgXcQ", "duration_seconds": 2}, headers=admin
    )
    assert r.status_code == 201, r.text
    asset = r.json()
    assert asset["kind"] == "youtube" and asset["status"] == "ready" and asset["youtube_id"] == "dQw4w9WgXcQ"
    assert asset["embed_url"] == "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    assert asset["thumbnail_url"].startswith("https://i.ytimg.com/vi/dQw4w9WgXcQ/")
    assert (await client.post(f"/assets/{asset['id']}/reprocess", headers=admin)).status_code == 409

    cid = await _quick_campaign(client, admin, asset_id=asset["id"])
    item = next(i for i in (await client.get("/campaigns/feed", headers=demo)).json()["items"] if i["id"] == cid)
    assert item["media_kind"] == "youtube" and item["youtube_id"] == "dQw4w9WgXcQ"
    assert item["embed_url"] and item["duration_seconds"] == 2

    # Like native video, YouTube campaigns need server-accounted watch time from player events.
    it = (await client.post("/interactions", json={"campaign_id": cid}, headers=demo)).json()
    assert it["required_seconds"] == 2
    await asyncio.sleep(2.1)
    r = await client.post(f"/interactions/{it['id']}/events",
                          json={"events": [{"type": "play", "position": 0}, {"type": "ended", "position": 2}]},
                          headers=demo)
    assert r.status_code == 200 and r.json()["watched_seconds"] == 2
    r = await client.post(f"/interactions/{it['id']}/submit", json={"rating": 5, "answer": "A phone"}, headers=demo)
    assert r.json()["status"] == "verified", r.json()


async def test_youtube_asset_rejects_bad_url(client, admin):
    r = await client.post("/assets/youtube", json={"url": "https://vimeo.com/1234", "duration_seconds": 5},
                          headers=admin)
    assert r.status_code == 400
