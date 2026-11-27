from tests.test_platform import _quick_campaign


async def _demo_id(client, admin) -> str:
    r = await client.get("/admin/users", params={"q": "demo"}, headers=admin)
    assert r.status_code == 200, r.text
    return next(u["id"] for u in r.json() if u["username"] == "demo")


async def test_admin_endpoints_require_admin(client, demo, advertiser):
    for h in (demo, advertiser, {}):
        assert (await client.get("/admin/users", headers=h)).status_code in (401, 403)
        assert (await client.get("/admin/deposits", headers=h)).status_code in (401, 403)


async def test_ban_blocks_login_and_existing_token_then_unban(client, admin, demo):
    uid = await _demo_id(client, admin)
    r = await client.post(f"/admin/users/{uid}/ban", json={"reason": "fraud"}, headers=admin)
    assert r.status_code == 200 and r.json()["is_active"] is False and r.json()["ban_reason"] == "fraud"
    assert (await client.get("/users/me", headers=demo)).status_code == 401
    bad = await client.post("/auth/login", json={"identifier": "demo", "password": "demo-password"})
    assert bad.status_code == 401
    r = await client.get("/admin/users", params={"banned": True}, headers=admin)
    assert [u["username"] for u in r.json()] == ["demo"]
    r = await client.post(f"/admin/users/{uid}/unban", headers=admin)
    assert r.json()["is_active"] is True and r.json()["banned_at"] is None
    assert (await client.get("/users/me", headers=demo)).status_code == 200


async def test_cannot_ban_self_or_admins(client, admin):
    me = (await client.get("/users/me", headers=admin)).json()["id"]
    r = await client.post(f"/admin/users/{me}/ban", json={"reason": "oops"}, headers=admin)
    assert r.status_code == 400


async def test_fund_adjustment_credit_debit_and_overdraft(client, admin, demo):
    uid = await _demo_id(client, admin)
    r = await client.post(f"/admin/users/{uid}/adjust", json={"amount": "25.50", "reason": "goodwill"}, headers=admin)
    assert r.status_code == 200, r.text
    assert r.json()["balances"]["rewards"] == "25.50"
    assert (await client.get("/rewards/balances", headers=demo)).json()["available"] == "25.50"
    r = await client.post(f"/admin/users/{uid}/adjust", json={"amount": "-10", "reason": "correction"}, headers=admin)
    assert r.json()["balances"]["rewards"] == "15.50"
    r = await client.post(f"/admin/users/{uid}/adjust", json={"amount": "-100", "reason": "too much"}, headers=admin)
    assert r.status_code == 409
    r = await client.post(f"/admin/users/{uid}/adjust", json={"amount": "0", "reason": "noop"}, headers=admin)
    assert r.status_code == 400


async def test_hide_and_delete_campaign(client, admin, demo):
    cid = await _quick_campaign(client, admin)
    feed = (await client.get("/campaigns/feed", headers=demo)).json()["items"]
    assert any(i["id"] == cid for i in feed)
    await client.post(f"/campaigns/{cid}/status", json={"status": "paused"}, headers=admin)
    feed = (await client.get("/campaigns/feed", headers=demo)).json()["items"]
    assert not any(i["id"] == cid for i in feed)
    assert (await client.delete(f"/admin/campaigns/{cid}", headers=admin)).status_code == 204
    assert (await client.get(f"/campaigns/{cid}", headers=admin)).status_code == 404
    assert (await client.delete(f"/admin/campaigns/{cid}", headers=admin)).status_code == 404
