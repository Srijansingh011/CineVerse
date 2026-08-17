# CineVerse — System Design

> Interview-ready explanations for every engineering decision in CineVerse.

---

## 1. How Seat Locking Works

**Problem**: Two users click on the same seat simultaneously. Both must not get a confirmed booking.

**Solution — Redis Lua atomic script**:
```lua
-- Check if seat is already locked or booked
local key = "seat_lock:" .. showId .. ":" .. seatId
local existing = redis.call("GET", key)
if existing then
  return 0  -- Seat already taken
end
-- Atomically set lock with 5-minute TTL
redis.call("SET", key, userId, "EX", 300)
return 1  -- Lock acquired
```

Why Lua? Redis executes Lua scripts atomically — no other command can run between the `GET` and `SET`. This eliminates the race condition.

After Redis lock → create PENDING booking in PostgreSQL → start Razorpay payment → webhook confirms → PostgreSQL transaction commits final CONFIRMED booking with unique constraint `(showId, seatId)` as the final safety net.

---

## 2. Why Redis?

- **Speed**: O(1) GET/SET for seat lock checks — sub-millisecond latency
- **Atomicity**: Lua scripts for check-and-set without race conditions
- **TTL**: Automatic seat lock expiry without cron jobs
- **Pub/Sub**: Real-time seat state broadcasting via Socket.IO adapter
- **Session storage**: JWT refresh token blacklist

---

## 3. Why PostgreSQL is the Source of Truth

Redis is volatile — a crash could lose locks. PostgreSQL is durable. The booking flow uses both:
- Redis for **temporary, fast, concurrent** seat locks (5 min TTL)
- PostgreSQL for **permanent, ACID-compliant** booking confirmation

The `@@unique([showId, seatId])` constraint on `BookingSeat` ensures no double booking survives even if Redis has a bug.

---

## 4. How Duplicate Bookings Are Prevented

Three-layer defense:
1. **Redis Lua atomic lock** — first check, sub-millisecond
2. **PostgreSQL transaction** — wraps all INSERT operations for booking confirmation
3. **Unique constraint** — `(showId, seatId)` — database enforces it at the storage level

Even if two requests bypass Redis simultaneously, only one PostgreSQL INSERT will succeed. The other gets a unique constraint violation → rolls back → returns 409.

---

## 5. How Payment Webhooks Work

```
Razorpay charges user
        ↓
Razorpay sends webhook POST to /api/bookings/webhook
        ↓
Server verifies HMAC-SHA256 signature
        ↓
Look up booking by payment_order_id
        ↓
If not already CONFIRMED (idempotency check)
        ↓
PostgreSQL transaction:
  - Update booking status = CONFIRMED
  - Confirm ShowSeat records
  - Release Redis lock
  - Generate QR code
  - Send notification
```

**Why not trust the frontend?** The frontend can be tampered with. Only the webhook from Razorpay (cryptographically signed) confirms payment.

---

## 6. How Idempotency Works

The `Booking.idempotencyKey` (client-generated UUID) and `Booking.paymentId` (Razorpay order ID) are both `@unique` in PostgreSQL.

If a webhook arrives twice for the same payment:
- First call: finds `status = PENDING`, transitions to CONFIRMED, returns 200
- Second call: finds `status = CONFIRMED`, returns 200 immediately (no duplicate action)

This makes the webhook handler safe to retry.

---

## 7. How Split Payment Works

```
Watch Party selects a show
        ↓
Create SplitPayment record (status: PENDING_SPLIT)
        ↓
Generate individual Razorpay orders for each member
        ↓
Each member pays their share independently
        ↓
BullMQ SplitPaymentWorker polls status
        ↓
When all members paid → FULLY_PAID → confirm group booking
        ↓
If timer (15 min) expires → EXPIRED → refund paid members → release seats
```

State machine: `PENDING_SPLIT → PARTIALLY_PAID → FULLY_PAID → CONFIRMED`

---

## 8. How Socket.IO Scales

Currently: single server instance, Socket.IO in-process.

For horizontal scaling:
- Use `@socket.io/redis-adapter` — all instances share a Redis Pub/Sub channel
- When seat is locked on server A, Redis broadcasts to server B, which pushes to its connected clients
- No client is missed

---

## 9. How Background Jobs Work (BullMQ)

BullMQ jobs in CineVerse:
| Queue | Job | Trigger |
|---|---|---|
| SeatLockQueue | Expire seat lock after 5 min | After Redis lock acquired |
| RefundQueue | Execute Razorpay refund | After cancel request |
| SplitPaymentQueue | Check split payment timeout | After SplitPayment created |
| NotificationQueue | Send email notification | After booking confirmed |

Each job is retried with exponential backoff on failure.

---

## 10. How Caching Works

Current Redis caching:
- **Trending movies**: cached for 5 minutes (`movies:trending`)
- **Movie detail**: cached for 10 minutes (`movie:{id}`)
- **Seat lock keys**: `seat_lock:{showId}:{seatId}` with 5-min TTL

Cache invalidation: movie updates clear the relevant keys.

---

## 11. How the Recommendation Engine Works

Score = `ratingHistory × 40 + genreMatch × 30 + friendLikes × 20 + showingBonus × 10`

Signals:
- **Rating history**: ratio of user's highly rated movies in the same genre
- **Genre match**: overlap between user's top genres and movie genres
- **Friend likes**: count of followed users who rated the movie ≥ 4.0
- **Showing bonus**: +10 if movie has active shows in user's city

Results filtered to exclude already-watched movies.

---

## 12. How Social Feeds Work

Feed = union of activities from all followed users, ordered by `createdAt DESC`.

Activities tracked: diary entries, reviews, list updates, follows.

Currently: simple Prisma query joining `Follow` → `User` activities.

**At scale**: materialized feed (fanout-on-write) — when User A acts, pre-insert into each follower's feed table (like Twitter's approach). This trades write amplification for fast reads.

---

## 13. How Taste Compatibility Works

**Cosine similarity** on rating vectors:
- Build a vector per user: dimension per movie, value = their rating
- Compute dot product / (magnitude A × magnitude B)
- Range: 0 (completely different) to 1 (identical taste)

**Jaccard similarity** on genre sets:
- User A likes [Action, Sci-Fi, Thriller]
- User B likes [Action, Horror, Thriller]
- Jaccard = |intersection| / |union| = 2/4 = 0.5

Final score = weighted average of both.

---

## 14. How the System Scales

| Bottleneck | Current | Solution at Scale |
|---|---|---|
| DB reads | Direct Prisma | Read replicas + connection pooling (PgBouncer) |
| Trending movies | DB query | Redis cache, pre-computed via BullMQ job |
| Seat locking | Redis single node | Redis Cluster |
| WebSocket | Single server | @socket.io/redis-adapter + horizontal scaling |
| Social feed | DB join on read | Materialized feed table (fanout-on-write) |
| Recommendations | Computed per request | Pre-compute nightly via BullMQ, cache in Redis |
| Search | Prisma ILIKE | PostgreSQL full-text search → later Elasticsearch |
| Images | Direct TMDB URLs | Cloudinary CDN + Next.js Image optimization |
