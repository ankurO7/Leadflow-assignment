# LeadFlow

A single-screen, lightweight CRM: track leads, log every conversation, and never miss a follow-up.

**Stack:** Next.js 14 (App Router, TypeScript) · FastAPI · SQLAlchemy · SQLite

## Features

- **Lead list** with name, status badge, last discussion note and time since last discussion
- **Today's follow-ups pinned** at the top; **overdue** follow-ups highlighted in red
- **Filter by status** (with counts) and **search by name**
- **Lead dialog** (not a page): full discussion history newest-first, add a note with an optional follow-up date/time, change status. Saving updates the list immediately
- **Add lead**: name required; company and phone optional; status defaults to New
- Seed data (7 leads with discussions), API tests, Docker Compose

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Open <http://localhost:3000>. API docs: <http://localhost:8000/docs>.
Demo data is seeded automatically on first start (`SEED_ON_START=true`).

## Local setup (without Docker)

Requires Python 3.11+ and Node 18.17+ (Node 20 recommended).

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed            # optional: demo data (add --reset to wipe first)
uvicorn app.main:app --reload --port 8000
```

**Frontend** (second terminal)
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```
Open <http://localhost:3000>.

**Tests**
```bash
cd backend && python -m pytest -q
cd frontend && npm run lint        # type-check
```

## Environment variables

See [`.env.example`](.env.example).

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | SQLAlchemy URL. Default `sqlite:///./data/leadflow.db` |
| `CORS_ORIGINS` | backend | Comma-separated origins allowed to call the API |
| `SEED_ON_START` | backend | Seed demo data if the DB is empty |
| `NEXT_PUBLIC_API_URL` | frontend | API base URL as seen from the browser (inlined at build time) |

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/leads?status=&q=` | List leads with `last_note` and `last_discussion_at` |
| POST | `/api/leads` | `201`. `name` required, status defaults to `New` |
| GET | `/api/leads/{id}` | `404` if missing |
| PATCH | `/api/leads/{id}` | Partial update; `follow_up_at: null` clears the follow-up |
| GET | `/api/leads/{id}/discussions` | Newest first |
| POST | `/api/leads/{id}/discussions` | `201`. Body `{note, follow_up_at?}`; if `follow_up_at` is set the lead's follow-up is updated. Returns `{discussion, lead}` so the UI can update in one round trip |

Errors: `404` for unknown leads, `422` for validation problems (blank name, empty note, unknown status).

## Design decisions

- **Timestamps** are stored and returned as UTC (`...Z`). The browser decides what "today" and "overdue" mean in the rep's local timezone, so pinning is computed client-side from the UTC values.
- **Last note / time ago** come from the newest discussion; the API returns them on each lead so the list needs a single request.
- **Filtering and search** run client-side over the loaded list so filter counts stay live and the UI feels instant. The API also supports `status` and `q` for larger datasets.
- **Pinning rule:** leads whose follow-up falls on today's local date are pinned, earliest first. Remaining leads show overdue ones first, then most recent activity.
- **"Mark done"** in the dialog clears a lead's follow-up. Not in the brief, but without it a follow-up can never be dismissed.
- **Native `<dialog>`** gives focus trapping and Esc-to-close without a library.
- **Out of scope:** auth, editing/deleting leads and notes, pagination, migrations (tables are created on startup).

## Project layout

```
backend/app/        main.py, models.py, schemas.py, routers_leads.py, seed.py
backend/tests/      API tests (pytest)
frontend/src/app/   layout + page
frontend/src/components/  LeadBoard, LeadList, LeadRow, LeadDialog, Timeline, DiscussionForm, AddLeadDialog, FilterBar, Modal, StatusBadge
frontend/src/lib/   api client, types, time + sorting helpers
```

## Use of AI

This project was built with AI assistance (Claude by Anthropic) generating the initial code for the backend, tests, frontend and this README, which I then reviewed and ran.

What was verified: the 8 backend tests pass; the frontend type-checks and builds; the API flow (create, validation errors, 404, add discussion with follow-up, status update, CORS) was exercised over HTTP; the pinning/sorting logic was checked with sample data.
What was not verified by the AI: the Docker Compose setup and the UI in a real browser.

## Screenshots

**1. Lead list.** Today's follow-ups are pinned; overdue ones are red.
![Lead List](image-1.png)


**2. Filter by status and search by name**
![Filter and Search](image-2.png)

**3. Add a lead**
![Add Lead](image-3.png)
![List after Adding](image-4.png)

**4. Lead timeline dialog**
![Lead Timeline](image-5.png)

**5. Add a note with a follow-up. The list updates immediately.**
![Note Saved](image-6.png)
![List Updated](image-7.png)

**6. Change status from the dialog**
![Status Change](image-8.png)
![Status Changed](image-9.png)
![Final List](image-10.png)
