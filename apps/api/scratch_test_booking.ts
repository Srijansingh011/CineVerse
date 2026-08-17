import { PrismaClient } from '@repo/database';
import { BookingService } from './src/modules/bookings/bookings.service.js';

const prisma = new PrismaClient();

async function runBookingTest() {
  console.log('--- E2E Booking Flow Test ---');
  
  // 1. Get a test user
  const user = await prisma.user.findFirst({ where: { email: 'user@cineverse.com' } });
  if (!user) throw new Error('Test user not found');
  console.log(`✅ Using test user: ${user.email}`);

  // 2. Find Dune in Bengaluru for tomorrow
  const dune = await prisma.movie.findFirst({ where: { title: { contains: 'Dune' } } });
  const blr = await prisma.city.findFirst({ where: { name: 'Bengaluru' } });
  
  if (!dune || !blr) throw new Error('Missing Dune or Bengaluru data');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const show = await prisma.show.findFirst({
    where: {
      movieId: dune.id,
      screen: { theatre: { cityId: blr.id } },
      startTime: { gte: tomorrow }
    },
    include: {
      screen: { include: { theatre: true } },
      showSeats: { where: { status: 'AVAILABLE' }, take: 2 }
    }
  });

  if (!show || show.showSeats.length < 2) {
    throw new Error('Could not find a valid show for Dune in Bengaluru tomorrow with available seats');
  }

  console.log(`✅ Found Show: ${show.screen.theatre.name} - ${show.screen.name} at ${show.startTime}`);
  
  const seatIds = show.showSeats.map(s => s.id);
  console.log(`✅ Selected Seats to Lock: ${seatIds.join(', ')}`);

  // 3. Lock Seats via Redis + Postgres
  console.log('\n🔒 Attempting to lock seats...');
  const lockedResult = await BookingService.lockSeats(show.id, seatIds, user.id);
  console.log('✅ Seats successfully locked!');

  // Verify they are locked in DB
  const verifyLock = await prisma.showSeat.findMany({ where: { id: { in: seatIds } } });
  verifyLock.forEach(s => {
    console.log(`   Seat ${s.id} -> Status: ${s.status}, LockedBy: ${s.lockedById}`);
  });

  // 4. Create Booking
  console.log('\n🎟️ Creating booking...');
  const booking = await BookingService.createBooking(show.id, seatIds, user.id, 'idemp-key-test-123');
  console.log(`✅ Booking created! ID: ${booking.id}, Total Amount: ${booking.totalAmount}`);

  // Verify they are linked in DB
  const verifyBooking = await prisma.showSeat.findMany({ where: { id: { in: seatIds } } });
  verifyBooking.forEach(s => {
    console.log(`   Seat ${s.id} -> Booking ID: ${s.bookingId}`);
  });
  
  // Clean up
  console.log('\n🧹 Cleaning up test booking...');
  await prisma.showSeat.updateMany({
    where: { id: { in: seatIds } },
    data: { status: 'AVAILABLE', bookingId: null, lockedAt: null, lockedById: null }
  });
  await prisma.booking.delete({ where: { id: booking.id } });
  console.log('✅ Cleanup complete');
}

runBookingTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
