# End-to-End Functionality Fix Plan

## Summary
Wired the demo UI to the real Express/MongoDB backend while preserving all existing UI components and styling.

## Changes Made

### Backend
- **`/api/public/*`** — Public candidate routes: load interview, start/update sessions, reconnect
- **`GET /api/interviews/:id`** — Single interview for recruiters
- **Demo ID resolution** — `demo` slug maps to seeded `demo-invite-token` interview

### Frontend
- **`lib/api.ts`** — Central API client with JWT auth headers
- **Auth** — Login/signup use real API; dashboard validates token via `/api/auth/me`
- **Create** — AI questions + interview launch persist to MongoDB; copyable invite link
- **Interview** — Loads questions by URL id, creates session, WebSocket chunks + proctoring events, MediaRecorder
- **Dashboard/Review** — Fetches live interviews and sessions (demo fallback when offline)

## Run Full Stack

```bash
# Terminal 1 — MongoDB (if not running)
mongod

# Terminal 2 — Backend
cd backend && npm run seed && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run prod
```

**Demo login:** `admin@test.com` / `password123`

## Verified Flows
1. Login → JWT → dashboard auth guard
2. Create interview → POST `/api/interviews` → `/interview/{id}` link
3. Candidate interview → session + WebSocket + proctoring
4. Review → sessions + scores from seed data at `/review/demo`
