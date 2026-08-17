import { PrismaClient } from '@repo/database';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Starting Webhook Scenarios Test ---');
  const baseUrl = 'http://localhost:4001/api';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

  async function createTestBooking() {
    const user = await prisma.user.findFirst({ where: { email: 'user@cineverse.com' } });
    const show = await prisma.show.findFirst({ include: { showSeats: { where: { status: 'AVAILABLE' }, take: 1 } } });
    
    const booking = await prisma.booking.create({
      data: {
        userId: user!.id, showId: show!.id, status: 'PENDING', totalAmount: 500,
        idempotencyKey: 'webhook-test-' + Date.now(),
      }
    });

    await prisma.showSeat.update({
      where: { id: show!.showSeats[0].id },
      data: { bookingId: booking.id, status: 'LOCKED', lockedById: user!.id }
    });

    return booking;
  }

  async function sendWebhook(event: string, bookingId: string, eventId: string) {
    const payload = {
      id: eventId,
      entity: "event", account_id: "acc_123", event, contains: ["payment"],
      payload: { payment: { entity: { id: "pay_" + Date.now(), amount: 50000, notes: { bookingId } } } },
      created_at: Math.floor(Date.now() / 1000)
    };

    const payloadString = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');

    const res = await fetch(`${baseUrl}/bookings/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature },
      body: payloadString
    });

    return { status: res.status, body: await res.json() };
  }

  // TEST 1: payment.failed
  console.log('\n--- TEST 1: payment.failed ---');
  const b1 = await createTestBooking();
  const res1 = await sendWebhook('payment.failed', b1.id, 'evt_fail_1');
  console.log(`Webhook Response: ${res1.status}`);
  
  await new Promise(r => setTimeout(r, 2000));
  
  const failEvent = await prisma.webhookEvent.findFirst({ where: { eventId: 'evt_fail_1' } });
  const b1Check = await prisma.booking.findUnique({ where: { id: b1.id } });
  console.log(`Processed: ${failEvent?.processed} | Booking Status: ${b1Check?.status}`);

  // TEST 2: duplicate webhook (idempotency)
  console.log('\n--- TEST 2: duplicate webhook ---');
  const b2 = await createTestBooking();
  const res2a = await sendWebhook('payment.captured', b2.id, 'evt_dup_1');
  console.log(`Webhook 1 Response: ${res2a.status} (${res2a.body.message})`);
  
  const res2b = await sendWebhook('payment.captured', b2.id, 'evt_dup_1');
  console.log(`Webhook 2 Response: ${res2b.status} (${res2b.body.message})`);

  await new Promise(r => setTimeout(r, 2000));
  
  const dupEvent = await prisma.webhookEvent.findFirst({ where: { eventId: 'evt_dup_1' } });
  const b2Check = await prisma.booking.findUnique({ where: { id: b2.id } });
  console.log(`Processed: ${dupEvent?.processed} | Booking Status: ${b2Check?.status}`);
  console.log('Test complete!');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
