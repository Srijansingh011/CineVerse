# CineVerse 🎬

> **Social Movie Discovery & Intelligent Cinema Booking Platform**
>
> A production-grade full-stack application combining Letterboxd-style movie discovery, real-time concurrency-safe seat booking, group watch parties, split payments, personalized recommendations, and an AI-powered movie assistant.

---

## 🚀 Live Demo
- **Frontend**: https://cineverse.vercel.app *(deploy to update)*
- **API**: https://api.cineverse.app *(deploy to update)*

---

## ✨ Features

### 🎥 Movie Discovery
- TMDB-powered trending, now playing, and upcoming movies
- Genre, language, and rating filters
- Movie details with cast, trailers, and reviews

### 🎭 Letterboxd Social Layer
- Movie diary with watched dates and rewatches
- Star ratings (0.5–5.0) + multi-dimensional cinema ratings (comfort, sound, screen)
- Public reviews with likes and comments
- Custom lists (public/private) with drag-and-drop ordering
- Social follow system + activity feed
- Movie taste compatibility (Cosine & Jaccard similarity)

### 🎫 Cinema Booking Engine
- City → Theatre → Show → Seat selection flow
- **Real-time Redis Lua atomic seat locking** (flagship feature)
- Socket.IO live seat state updates
- BullMQ 5-minute lock expiry worker
- Razorpay payment integration
- Idempotent webhook handling
- Digital QR tickets

### 🎉 Watch Parties & Group Booking
- Create a party, invite friends, vote on movies
- Adjacent seat allocation algorithm
- Split payment per member with 15-minute expiry
- Razorpay individual payment links

### 🗓️ Movie Night Planner
- Auto-selects show from friend taste compatibility + availability
- Step-by-step wizard into group booking with split payment

### 🤖 Intelligence Layer
- **AI Taste Match Recommendations** — scored from ratings, genres, friend likes, showing status
- **AI Movie Assistant** — conversational chat for recommendations and showtimes
- **AI Review Summaries** — community sentiment analysis stored per movie

### 🏆 Gamification
- XP system: +100 for bookings, +25 for reviews, +15 for diary entries
- Level progression and badge unlocks
- Global and friend leaderboards
- Movie curation challenges with progress tracking

---

## 🏗️ Architecture

```
Next.js 16 (TypeScript)
       │
  REST + WebSocket
       │
  Express API (TypeScript)
       │
┌──────┴──────────┬──────────────┐
│                 │              │
PostgreSQL    Redis 7        BullMQ
(Prisma ORM)  (Seat Locks)  (Async Jobs)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| State | Zustand, TanStack Query |
| Charts | Recharts |
| Backend | Express, TypeScript, Socket.IO |
| Database | PostgreSQL 16, Prisma ORM |
| Cache/Locks | Redis 7, Redis Lua scripts |
| Queue | BullMQ |
| Payments | Razorpay |
| Movie Data | TMDB API |
| Media | Cloudinary |
| Auth | JWT (access + refresh), HTTP-only cookies |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Deployment | Vercel (frontend), Railway (API) |

---

## 🚦 Local Development

### Prerequisites
- Node.js 22+
- pnpm 9+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/cineverse.git
cd cineverse

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 4. Copy environment files
cp .env.example packages/database/.env
cp .env.example apps/api/.env
# Edit both .env files with your values

# 5. Run database migrations and seed
pnpm --filter @repo/database exec prisma db push
pnpm --filter @repo/database exec prisma db seed

# 6. Start development servers (in separate terminals)
pnpm --filter api dev       # API → http://localhost:4000
pnpm --filter web dev       # Web → http://localhost:3000
```

---

## 🔐 Environment Variables

See [`.env.example`](.env.example) for all required variables.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — JWT signing secrets
- `TMDB_API_KEY` — The Movie Database API key ([get one free](https://www.themoviedb.org/settings/api))
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay credentials

---

## 🐳 Docker

### Development
```bash
docker compose up -d
```

### Production
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm --filter api test

# Build verification
pnpm --filter api build
pnpm --filter web build
```

---

## 🚀 Deployment

### Frontend — Vercel
```bash
cd apps/web
npx vercel --prod
```

### API — Railway
```bash
# Push to main branch → GitHub Actions auto-deploys
git push origin main
```

---

## 👤 Demo Credentials

After running the seed script:
- **User**: `user@cineverse.com` / `password123`
- **Admin**: `admin@cineverse.com` / `password123`
- **Theatre Owner**: `owner@cineverse.com` / `password123`

---

## 📄 License

MIT — feel free to use for portfolio or learning.
