# HireAI — AI Video Interview Platform

> The AI that interviews for you. 24/7. At scale. Without bias.

A full-stack automated video interview platform with jaw-dropping 3D homepage, real-time proctoring, AI-powered evaluation, and Netflix-style interview replay.

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Docker)
- API keys (optional for demo mode)

### Setup

```bash
chmod +x setup.sh && ./setup.sh
cp .env.example .env   # Fill in API keys
```

### Run with Docker (easiest)

```bash
docker-compose up --build
```

### Run manually

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Workers (optional)
cd workers && npm run dev
```

Open **http://localhost:3000** — you'll see the 3D homepage first.

**Demo login:** `admin@test.com` / `password123`

---

## Architecture

```
┌─────────────┐     HTTP/REST      ┌─────────────┐
│   Next.js   │ ◄────────────────► │   Express   │
│  Frontend   │                    │   Backend   │
│  (port 3000)│     WebSocket      │  (port 4000)│
└─────────────┘ ◄────────────────► └──────┬──────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
              ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
              │  MongoDB  │        │    S3     │        │  Workers  │
              │           │        │  (chunks) │        │  FFmpeg   │
              └───────────┘        └───────────┘        │ Deepgram  │
                                                        │  Claude   │
                                                        └───────────┘
```

### 22-Step Media Flow

1. Candidate opens interview link
2. Hardware check (camera, mic, network, browser)
3. WebSocket connection established with traceId
4. AI avatar asks question (ElevenLabs TTS)
5. Candidate records answer (MediaRecorder)
6. Audio/video chunked every 2s
7. Chunks streamed via WebSocket with sequence numbers
8. MD5 hash computed per chunk for deduplication
9. Chunks uploaded to S3 with retry + exponential backoff
10. Proctoring events sent in parallel (face, tab, voice)
11. Candidate submits answer
12. AI reviews answer (Claude) — generates follow-up if needed
13. Devil's Advocate follow-up question (optional)
14. Repeat steps 4-13 for all questions
15. Interview marked complete, status → processing
16. Worker picks up session from queue
17. FFmpeg merges chunks into single video (30s timeout)
18. Deepgram transcribes merged audio
19. Claude evaluates each answer + overall score
20. Highlight reel generated (90s best moments)
21. Scorecard PDF generated (Puppeteer)
22. Email sent to recruiter with links

### WebSocket Channel Separation

- **Control channel:** join, ping/pong, reconnect, question navigation
- **Media channel:** chunk upload with sequence + MD5 ack
- **Proctoring channel:** real-time event streaming

---

## Technical Decisions

### Why streaming over full upload?
- Reduces data loss on network interruption
- Enables real-time proctoring during recording
- Lower perceived latency for long answers
- Chunks can be processed in parallel post-interview

### Why SQS over direct Lambda?
- Decouples upload from processing — upload never blocks
- Built-in retry with DLQ for failed processing
- Rate limiting for expensive AI/FFmpeg operations
- Visibility timeout handles long-running FFmpeg jobs

### Why Deepgram over Whisper?
- Real-time streaming transcription during interview
- Lower latency for live captioning
- Better handling of accents and technical vocabulary
- Native WebSocket API for streaming

### Why MongoDB?
- Flexible schema for session_data (chunk sequences, reconnect state)
- Document model fits interview → answers → events hierarchy
- Easy to query proctoring events as embedded arrays
- Horizontal scaling with sharding for interview sessions

---

## Failure Scenarios & Recovery

| Scenario | Recovery |
|----------|----------|
| Network interruption | Exponential backoff retry (1s, 2s, 4s, 8s, 16s) |
| Duplicate chunks | MD5 deduplication — ack without re-upload |
| Camera/mic disconnect | Overlay prompts reconnect, pauses recording |
| Partial uploads | 30s FFmpeg timeout, silence padding for gaps |
| WebSocket disconnect | 5 retry attempts, resume from lastChunkSequence |
| Empty/corrupted chunks | Validated on merge, silence padding inserted |
| Worker crash | SQS visibility timeout re-queues message |

### 5-Step WebSocket Reconnect Protocol

1. Client detects disconnect, waits 1s
2. Client reconnects with `{ type: 'reconnect', interviewId, lastSequence }`
3. Server checks reconnect count (< 5)
4. Server returns missing chunk sequences
5. Client re-uploads missing chunks, resumes recording

Session state persisted in `AiInterview.session_data`:
```json
{
  "currentQuestion": 2,
  "chunks": [{ "sequence": 0, "md5": "abc...", "s3Key": "..." }],
  "wsReconnectCount": 1,
  "lastChunkSequence": 14
}
```

---

## Product Thinking

### Candidate Anxiety Reduction
- **Ghost mode:** AI avatar instead of live human observer
- **Hardware check:** Validates setup before pressure begins
- **Warm-up question:** First question is always easy/intro
- **Async format:** Take interview on their schedule
- **Progress indicator:** Always know where they are

### Recruiter Time Saving
- **90-second highlight reels** instead of 45-minute full videos
- **AI scorecards** with recommendation badges
- **Heatmap timeline** showing proctoring events
- **Chapter markers** for quick navigation
- **PDF export** for sharing with hiring committee

### Fair Proctoring Philosophy
- Events are flagged, not auto-rejected
- Context provided (duration, severity)
- Human reviewer makes final decision
- Stress analysis used for support, not elimination

---

## Scalability

### Current Bottlenecks
- FFmpeg merge is CPU-bound (single worker)
- Claude API rate limits at ~50 concurrent evaluations
- S3 upload bandwidth per interview (~500MB/hour at peak)

### What breaks at 10k concurrent interviews
- WebSocket connections (need horizontal scaling + sticky sessions)
- FFmpeg workers (need dedicated GPU instances)
- MongoDB write throughput on session_data updates

### Future Architecture
- **Kafka** for event streaming between services
- **WebRTC** for peer-to-peer media (reduce server load)
- **Edge computing** for proctoring (TensorFlow.js on client)
- **Redis** session caching for hot interview state

---

## Observability

- **traceId** flows through all services (frontend → backend → workers)
- **Winston** structured logging with JSON format
- **CloudWatch** metrics + alarms in production
- **Sentry** error tracking with interview context
- **PagerDuty** alerts on DLQ depth > 10
- **Debug endpoint:** `GET /api/interviews/debug/:interviewId`

---

## AI Usage Documentation

### Prompt Strategy: Understand → Explore → Decide

1. **Understand:** Analyze job description for key competencies
2. **Explore:** Generate diverse question types (behavioral, technical, situational)
3. **Decide:** Score answers against rubric with evidence citations

### What AI Helped With
- System architecture design and failure scenario analysis
- Frontend component structure and animation patterns
- API route design and WebSocket protocol
- README documentation and ASCII diagrams

### Human Decisions
- Technology stack selection (Next.js, Express, MongoDB)
- UX flow for candidate anxiety reduction
- Proctoring fairness philosophy
- Scoring rubric weights and thresholds

---

## Project Structure

```
ai-interview-system/
├── frontend/          # Next.js 14 + Three.js + GSAP
│   ├── app/           # Pages (homepage, login, dashboard, etc.)
│   └── components/    # Reusable UI + 3D components
├── backend/           # Express + WebSocket + MongoDB
│   └── src/
│       ├── routes/    # REST API endpoints
│       ├── models/    # Mongoose schemas
│       └── websocket.ts
├── workers/           # Background processing pipeline
├── docker-compose.yml
├── setup.sh
└── README.md
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| MongoDB connection refused | Check `MONGO_URI` in `.env`, start MongoDB |
| WebSocket connection failed | Verify `NEXT_PUBLIC_WS_URL=ws://localhost:4000` |
| Camera permission denied | Allow camera/mic in browser settings |
| TTS silent | Set `ELEVENLABS_API_KEY` in `.env` |
| Port 3000/4000 in use | Change `PORT` in `.env` |

---

## License

MIT — Built with ❤️ and Claude API
