# HireAI — Quick Start (Production Ready)

## Run the complete website (recommended)

```bash
# 1. Install dependencies (first time only)
chmod +x setup.sh start-prod.sh
./setup.sh

# 2. Production mode (stable — no blank pages)
./start-prod.sh
```

Open **http://localhost:3000**

## Demo login

| Email | Password |
|-------|----------|
| `admin@test.com` | `password123` |

Works **without** backend. MongoDB optional.

## All pages

| URL | Description |
|-----|-------------|
| `/` | 3D homepage |
| `/login` | Sign in |
| `/signup` | Create account + role picker |
| `/dashboard` | Recruiter overview |
| `/dashboard/interviews` | Interview list |
| `/dashboard/candidates` | Candidate table |
| `/dashboard/analytics` | Metrics |
| `/dashboard/settings` | Profile |
| `/create` | Create interview wizard |
| `/interview/demo` | Candidate interview flow |
| `/review/demo` | Netflix-style replay |

## Development mode

If you see **500 errors** or blank white pages in dev:

```bash
lsof -ti:3000 | xargs kill -9
cd frontend
rm -rf .next
npm run prod
```

Use `npm run prod` instead of `npm run dev` for a stable experience.

## Backend (optional)

```bash
cd backend && npm run dev   # port 4000
```
