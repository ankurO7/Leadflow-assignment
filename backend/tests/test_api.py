def make(client, **kw):
    body = {"name": "Ada Lovelace", **kw}
    r = client.post("/api/leads", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_create_defaults_to_new(client):
    lead = make(client, company="  Analytical Engines ", phone="")
    assert lead["status"] == "New"
    assert lead["company"] == "Analytical Engines"
    assert lead["phone"] is None
    assert lead["last_note"] is None


def test_create_requires_name(client):
    assert client.post("/api/leads", json={"name": "   "}).status_code == 422
    assert client.post("/api/leads", json={}).status_code == 422


def test_invalid_status_rejected(client):
    assert client.post("/api/leads", json={"name": "X", "status": "Maybe"}).status_code == 422


def test_unknown_lead_404(client):
    assert client.get("/api/leads/999").status_code == 404
    assert client.patch("/api/leads/999", json={"status": "Won"}).status_code == 404
    assert client.post("/api/leads/999/discussions", json={"note": "hi"}).status_code == 404


def test_discussion_updates_lead_and_orders_newest_first(client):
    lead = make(client)
    lid = lead["id"]
    r1 = client.post(f"/api/leads/{lid}/discussions", json={"note": "first"})
    assert r1.status_code == 201
    assert r1.json()["lead"]["follow_up_at"] is None

    r2 = client.post(
        f"/api/leads/{lid}/discussions",
        json={"note": "second", "follow_up_at": "2030-01-01T10:00:00+05:30"},
    )
    out = r2.json()
    assert out["lead"]["last_note"] == "second"
    assert out["lead"]["follow_up_at"] == "2030-01-01T04:30:00Z"  # normalised to UTC

    history = client.get(f"/api/leads/{lid}/discussions").json()
    assert [d["note"] for d in history] == ["second", "first"]

    # A later note without follow-up keeps the existing follow-up
    client.post(f"/api/leads/{lid}/discussions", json={"note": "third"})
    assert client.get(f"/api/leads/{lid}").json()["follow_up_at"] == "2030-01-01T04:30:00Z"


def test_empty_note_rejected(client):
    lid = make(client)["id"]
    assert client.post(f"/api/leads/{lid}/discussions", json={"note": "  "}).status_code == 422


def test_status_update_persists_and_follow_up_can_be_cleared(client):
    lead = make(client)
    lid = lead["id"]
    client.post(f"/api/leads/{lid}/discussions", json={"note": "x", "follow_up_at": "2030-01-01T00:00:00Z"})
    r = client.patch(f"/api/leads/{lid}", json={"status": "Qualified"})
    assert r.status_code == 200 and r.json()["status"] == "Qualified"
    assert r.json()["follow_up_at"] is not None  # untouched by status-only patch

    r = client.patch(f"/api/leads/{lid}", json={"follow_up_at": None})
    assert r.json()["follow_up_at"] is None
    assert client.get(f"/api/leads/{lid}").json()["status"] == "Qualified"
    assert client.patch(f"/api/leads/{lid}", json={"status": None}).status_code == 422


def test_list_filter_and_search(client):
    make(client, name="Alice Smith", status="Won")
    make(client, name="Bob Jones")
    assert len(client.get("/api/leads").json()) == 2
    assert [l["name"] for l in client.get("/api/leads?status=Won").json()] == ["Alice Smith"]
    assert [l["name"] for l in client.get("/api/leads?q=bOb").json()] == ["Bob Jones"]
    assert client.get("/api/leads?status=Nope").status_code == 422
