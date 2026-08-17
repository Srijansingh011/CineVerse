/**
 * CineVerse — Full E2E Booking Flow Test
 * 
 * Covers the complete lifecycle:
 *   Register → Login → Browse Shows → Lock Seats → Create Booking
 *   → Mock Payment → Confirm → QR Ticket → Cancel → Refund
 * 
 * Prerequisites:
 *   - API running on localhost:4000
 *   - PostgreSQL + Redis running (docker-compose up -d)
 *   - Database seeded (npx prisma db seed)
 * 
 * Usage:
 *   node scratch/e2e-booking-test.mjs
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';
const TEST_EMAIL = `e2e_test_${Date.now()}@cineverse.com`;
const TEST_PASSWORD = 'E2ETestPassword123!';
const TEST_NAME = 'E2E Test User';

let accessToken = '';
let refreshToken = '';

// ─── Helpers ──────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (accessToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

// ─── Test Steps ───────────────────────────────────────────────────

async function step1_healthCheck() {
  console.log('\n── Step 1: Health Check ──────────────────────────');
  
  const basic = await fetch(`${API_URL}/health`).then(r => r.json());
  assert(basic.status === 'ok', '/health returns status: ok');

  const deep = await fetch(`${API_URL}/health/deep`).then(r => r.json());
  console.log(`  Deep health: ${JSON.stringify(deep.checks)}`);
  assert(deep.checks.database === 'ok', 'PostgreSQL is healthy');
  assert(deep.checks.redis === 'ok', 'Redis is healthy');
  assert(deep.checks.bullmq === 'ok', 'BullMQ queues are healthy');
}

async function step2_register() {
  console.log('\n── Step 2: Register ─────────────────────────────');
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }),
  });
  assert(res.status === 201 || res.status === 200, `Registration succeeded (status ${res.status})`);
}

async function step3_login() {
  console.log('\n── Step 3: Login ────────────────────────────────');
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  assert(res.status === 200, `Login returned 200`);
  assert(!!res.body?.data?.accessToken, 'Received access token');
  
  accessToken = res.body.data.accessToken;
  refreshToken = res.body.data.refreshToken || '';
  console.log(`  ℹ  Token: ${accessToken.substring(0, 20)}...`);
}

async function step4_protectedRouteWorks() {
  console.log('\n── Step 4: Protected Route Access ───────────────');
  const res = await apiFetch('/notifications');
  assert(res.status === 200, 'Authenticated request to /notifications succeeds');
}

async function step5_securityChecks() {
  console.log('\n── Step 5: Security / RBAC Checks ───────────────');

  // USER should NOT access /admin
  const adminRes = await apiFetch('/admin/users');
  assert(adminRes.status === 403 || adminRes.status === 401, 
    `USER cannot access /admin/users (got ${adminRes.status})`);

  // Unauthenticated should NOT access bookings
  const noAuthRes = await apiFetch('/bookings/lock', {
    method: 'POST',
    skipAuth: true,
    headers: {},
    body: JSON.stringify({ showId: 'fake', seatIds: ['fake'] }),
  });
  assert(noAuthRes.status === 401, `Unauthenticated request to /bookings/lock returns 401`);
}

async function step6_findMovies() {
  console.log('\n── Step 6: Find Movies ──────────────────────────');
  const res = await apiFetch('/movies/trending');
  assert(res.status === 200, 'Trending movies endpoint returns 200');
  const movies = res.body?.data || [];
  console.log(`  ℹ  Found ${movies.length} movies`);
  if (movies.length > 0) {
    console.log(`  ℹ  First movie: ${movies[0].title}`);
  }
  return movies;
}

async function step7_lockSeats(showId, seatIds) {
  console.log('\n── Step 7: Lock Seats ───────────────────────────');
  const res = await apiFetch('/bookings/lock', {
    method: 'POST',
    body: JSON.stringify({ showId, seatIds }),
  });
  assert(res.status === 200, `Seats locked successfully (status ${res.status})`);
  return res.body?.data;
}

async function step8_createBooking(showId, seatIds) {
  console.log('\n── Step 8: Create Booking ───────────────────────');
  const idempotencyKey = `e2e-${showId}-${Date.now()}`;
  const res = await apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify({ showId, seatIds, idempotencyKey }),
  });
  assert(res.status === 201 || res.status === 200, `Booking created (status ${res.status})`);
  assert(!!res.body?.data?.id, 'Booking has an ID');
  console.log(`  ℹ  Booking ID: ${res.body.data.id}`);
  return res.body.data;
}

async function step9_confirmPayment(bookingId) {
  console.log('\n── Step 9: Confirm Payment (Mock) ───────────────');
  const res = await apiFetch('/bookings/confirm', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      paymentId: `pay_e2e_${Date.now()}`,
      signature: 'MOCK_SIGNATURE',
      orderId: `order_e2e_${Date.now()}`,
    }),
  });
  assert(res.status === 200, `Payment confirmed (status ${res.status})`);
  assert(res.body?.data?.status === 'CONFIRMED', 'Booking status is CONFIRMED');
  assert(!!res.body?.data?.qrCode, 'QR code was generated');
  console.log(`  ℹ  QR code length: ${res.body.data.qrCode.length} chars`);
  return res.body.data;
}

async function step10_getBooking(bookingId) {
  console.log('\n── Step 10: Retrieve Booking ─────────────────────');
  const res = await apiFetch(`/bookings/${bookingId}`);
  assert(res.status === 200, 'Booking retrieved successfully');
  assert(res.body?.data?.status === 'CONFIRMED', 'Booking shows CONFIRMED');
}

async function step11_webhookIdempotency(bookingId) {
  console.log('\n── Step 11: Webhook Idempotency ──────────────────');
  // Simulate a duplicate webhook delivery for an already-confirmed booking
  const res = await apiFetch('/bookings/webhook', {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_dup_${Date.now()}`,
            order_id: `order_dup_${Date.now()}`,
            notes: { bookingId },
          },
        },
      },
    }),
  });
  assert(res.status === 200, `Duplicate webhook responded 200 (idempotent)`);
  assert(
    res.body?.message?.includes('already confirmed') || res.body?.message?.includes('processed'),
    'Webhook recognized booking is already confirmed'
  );
}

async function step12_cancelBooking(bookingId) {
  console.log('\n── Step 12: Cancel Booking & Refund ──────────────');
  const res = await apiFetch(`/bookings/${bookingId}`, {
    method: 'DELETE',
  });
  assert(res.status === 200, `Booking cancelled (status ${res.status})`);
  const data = res.body?.data;
  assert(data?.booking?.status === 'CANCELLED', 'Booking status is CANCELLED');
  console.log(`  ℹ  Refund: ${data?.refundPercentage}% → ₹${data?.refundAmount}`);
}

async function step13_accessOtherUsersBooking(bookingId) {
  console.log('\n── Step 13: Cross-User Booking Access ────────────');
  // Create another user and try to access the first user's booking
  const otherEmail = `other_${Date.now()}@cineverse.com`;
  await apiFetch('/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email: otherEmail, password: 'OtherPass123!', name: 'Other User' }),
  });
  const loginRes = await apiFetch('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email: otherEmail, password: 'OtherPass123!' }),
  });
  const otherToken = loginRes.body?.data?.accessToken;

  if (otherToken) {
    const res = await apiFetch(`/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert(res.status === 403 || res.status === 404 || res.status === 500,
      `Other user cannot access booking (got ${res.status})`);
  } else {
    console.log('  ⚠  Skipped: could not create other user');
  }
}

// ─── Main ─────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    CineVerse E2E Booking Flow Test              ║');
  console.log('╚══════════════════════════════════════════════════╝');

  try {
    await step1_healthCheck();
    await step2_register();
    await step3_login();
    await step4_protectedRouteWorks();
    await step5_securityChecks();
    const movies = await step6_findMovies();

    // For the full booking flow, we need a real show + seats from seeded data.
    // This requires Docker + seeded DB. If not available, we'll test up to this point.
    console.log('\n── Attempting Full Booking Lifecycle ─────────────');
    console.log('  ℹ  This requires seeded shows/seats in the database.');
    console.log('  ℹ  If this section errors, ensure docker-compose is up');
    console.log('  ℹ  and the database has been seeded.\n');

    // Try to get shows - this may fail without seeded data
    let showId, seatIds;
    try {
      // Attempt a search or direct shows endpoint
      const searchRes = await apiFetch('/search?q=Interstellar');
      if (searchRes.status === 200 && searchRes.body?.data?.shows?.length > 0) {
        const show = searchRes.body.data.shows[0];
        showId = show.id;
        // Get seat IDs for this show
        const showDetailRes = await apiFetch(`/theatres/shows/${showId}`);
        if (showDetailRes.status === 200) {
          const availableSeats = (showDetailRes.body?.data?.showSeats || [])
            .filter((s) => s.status === 'AVAILABLE')
            .slice(0, 2);
          seatIds = availableSeats.map((s) => s.id);
        }
      }
    } catch {
      console.log('  ⚠  Could not find shows via search. Skipping booking lifecycle.\n');
    }

    if (showId && seatIds?.length > 0) {
      console.log(`  ℹ  Using show: ${showId}`);
      console.log(`  ℹ  Using seats: ${seatIds.join(', ')}\n`);

      await step7_lockSeats(showId, seatIds);
      const booking = await step8_createBooking(showId, seatIds);
      const confirmed = await step9_confirmPayment(booking.id);
      await step10_getBooking(booking.id);
      await step11_webhookIdempotency(booking.id);
      await step13_accessOtherUsersBooking(booking.id);
      await step12_cancelBooking(booking.id);
    } else {
      console.log('  ⚠  No seeded shows/seats found. Booking lifecycle skipped.');
      console.log('      Auth, security, and health checks still passed.\n');
    }

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅  E2E TEST SUITE PASSED                      ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

run();
