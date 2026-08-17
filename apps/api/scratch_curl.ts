import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function runEndToEnd() {
  console.log('--- Starting API E2E Booking Flow ---');
  const baseUrl = 'http://localhost:4000/api';

  // 1. Get IDs via DB
  const dune = await prisma.movie.findFirst({ where: { title: { contains: 'Dune' } } });
  const blr = await prisma.city.findFirst({ where: { name: 'Bengaluru' } });
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const show = await prisma.show.findFirst({
    where: {
      movieId: dune!.id,
      screen: { theatre: { cityId: blr!.id } },
      startTime: { gte: tomorrow }
    },
    include: {
      screen: { include: { theatre: true } },
      showSeats: { where: { status: 'AVAILABLE' }, take: 2 }
    }
  });

  const seatIds = show!.showSeats.map(s => s.id);
  console.log(`✅ Using Show: ${show!.id}`);
  console.log(`✅ Using Seats: ${seatIds.join(', ')}`);

  // 2. Signup & Login to get token
  const testEmail = `testuser_${Date.now()}@cineverse.com`;
  const signupRes = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: testEmail, password: 'password123' })
  });
  if (!signupRes.ok) throw new Error(`Signup failed: ${await signupRes.text()}`);

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'password123' })
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
  
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;
  console.log(`✅ Signed up and logged in successfully as ${testEmail}`);

  // 3. Lock Seats API
  console.log('\n🔒 API Call: /bookings/lock');
  const lockRes = await fetch(`${baseUrl}/bookings/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ showId: show!.id, seatIds })
  });
  if (!lockRes.ok) throw new Error(`Lock failed: ${await lockRes.text()}`);
  console.log('✅ Seats locked via API!');

  // Verify in DB
  const verifyLock = await prisma.showSeat.findMany({ where: { id: { in: seatIds } } });
  verifyLock.forEach(s => console.log(`   Seat ${s.id} -> Status: ${s.status}`));

  // 4. Create Booking API
  console.log('\n🎟️ API Call: /bookings');
  const bookRes = await fetch(`${baseUrl}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ showId: show!.id, seatIds, idempotencyKey: 'test-flow-' + Date.now() })
  });
  if (!bookRes.ok) throw new Error(`Booking failed: ${await bookRes.text()}`);
  const bookData = await bookRes.json();
  const bookingId = bookData.data.id;
  console.log(`✅ Booking created! ID: ${bookingId}, Total Amount: ${bookData.data.totalAmount}`);

  // Clean up
  console.log('\n🧹 Cleaning up test booking...');
  await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  
  await prisma.showSeat.updateMany({
    where: { id: { in: seatIds } },
    data: { status: 'AVAILABLE', bookingId: null, lockedAt: null, lockedById: null }
  });
  await prisma.booking.delete({ where: { id: bookingId } });
  
  console.log('✅ Pipeline Test Passed & Cleaned Up');
}

runEndToEnd()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
