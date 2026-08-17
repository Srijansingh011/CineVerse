import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function runConcurrencyTest() {
  console.log('--- Starting 50-User Concurrency Test ---');
  const baseUrl = 'http://localhost:4000/api';

  // 1. Signup to get token
  const testEmail = `test_concurrency_${Date.now()}@cineverse.com`;
  const signupRes = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Concurrency Tester', email: testEmail, password: 'password123' })
  });

  if (!signupRes.ok) throw new Error(`Signup failed: ${await signupRes.text()}`);
  
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'password123' })
  });

  if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
  const { data: { accessToken: token } } = await loginRes.json();
  console.log(`✅ Logged in successfully: ${testEmail}`);

  // 3. Pick a target seat
  const show = await prisma.show.findFirst({
    include: { showSeats: { where: { status: 'AVAILABLE' }, take: 1 } }
  });

  if (!show || show.showSeats.length === 0) {
    throw new Error('No available seats to test concurrency!');
  }

  const targetSeatId = show.showSeats[0].id;
  console.log(`\n🎯 Target Show: ${show.id}`);
  console.log(`🎯 Target Seat: ${targetSeatId}`);

  // 4. Fire 50 simultaneous lock requests
  console.log(`\n🚀 Firing 50 concurrent lock requests...`);
  const numRequests = 50;
  const requests = [];

  for (let i = 0; i < numRequests; i++) {
    requests.push(
      fetch(`${baseUrl}/bookings/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ showId: show.id, seatIds: [targetSeatId] })
      })
    );
  }

  const responses = await Promise.all(requests);

  // 5. Analyze Results
  let successes = 0;
  let conflicts = 0;
  let others = 0;

  for (const res of responses) {
    if (res.status === 200) successes++;
    else if (res.status === 409) conflicts++;
    else others++;
  }

  console.log(`\n📊 TEST RESULTS:`);
  console.log(`✅ Success (200 OK): ${successes}`);
  console.log(`❌ Conflict (409 Conflict): ${conflicts}`);
  console.log(`⚠️ Other Status: ${others}`);

  if (successes !== 1 || conflicts !== 49) {
    console.error(`\n🚨 CRITICAL FAILURE: Expected exactly 1 success and 49 conflicts!`);
  } else {
    console.log(`\n🎉 PERFECT: Distributed Atomic Lock held successfully under heavy load!`);
  }

  // 6. Verify Database Integrity
  const seatCheck = await prisma.showSeat.findUnique({ where: { id: targetSeatId } });
  console.log(`\n💾 POSTGRES VERIFICATION:`);
  console.log(`   Seat Status: ${seatCheck?.status}`);
  console.log(`   Locked By: ${seatCheck?.lockedById}`);

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await prisma.showSeat.update({
    where: { id: targetSeatId },
    data: { status: 'AVAILABLE', lockedAt: null, lockedById: null }
  });
}

runConcurrencyTest().catch(console.error).finally(() => prisma.$disconnect());
