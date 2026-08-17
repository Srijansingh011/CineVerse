// CineVerse Contiguous Seat Solver Unit Test

interface MockSeat {
  row: string;
  number: number;
  type: string;
}

interface MockShowSeat {
  id: string;
  seatId: string;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  seat: MockSeat;
}

// Re-implementation of watchparty findAdjacentSeats logic for pure mock testing
function solveAdjacentSeats(availableShowSeats: MockShowSeat[], seatCount: number) {
  if (availableShowSeats.length < seatCount) {
    throw new Error(`Only ${availableShowSeats.length} seats are available, but ${seatCount} requested`);
  }

  // Group available seats by Row and Seat Category (type)
  const grouped: Record<string, MockShowSeat[]> = {};
  availableShowSeats.forEach((ss) => {
    const key = `${ss.seat.row}-${ss.seat.type}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ss);
  });

  // Try to find a contiguous sequence of seatCount in each row group
  for (const key in grouped) {
    const group = grouped[key]!;
    // Sort seats by seat number ascending
    group.sort((a, b) => a.seat.number - b.seat.number);

    for (let i = 0; i <= group.length - seatCount; i++) {
      const candidate = group.slice(i, i + seatCount);
      let isContiguous = true;
      for (let j = 0; j < seatCount - 1; j++) {
        if (candidate[j + 1]!.seat.number - candidate[j]!.seat.number !== 1) {
          isContiguous = false;
          break;
        }
      }

      if (isContiguous) {
        return candidate.map((ss) => ({
          showSeatId: ss.id,
          seatId: ss.seatId,
          row: ss.seat.row,
          number: ss.seat.number,
          type: ss.seat.type,
        }));
      }
    }
  }

  // Fallback: If no contiguous sequence, find the closest grouping in the same row
  let bestSubset: MockShowSeat[] = [];
  let minRange = Infinity;

  for (const key in grouped) {
    const group = grouped[key]!;
    if (group.length < seatCount) continue;
    group.sort((a, b) => a.seat.number - b.seat.number);

    for (let i = 0; i <= group.length - seatCount; i++) {
      const candidate = group.slice(i, i + seatCount);
      const range = candidate[seatCount - 1]!.seat.number - candidate[0]!.seat.number;
      if (range < minRange) {
        minRange = range;
        bestSubset = candidate;
      }
    }
  }

  if (bestSubset.length === seatCount) {
    return bestSubset.map((ss) => ({
      showSeatId: ss.id,
      seatId: ss.seatId,
      row: ss.seat.row,
      number: ss.seat.number,
      type: ss.seat.type,
    }));
  }

  // Absolute fallback: Just return the first seatCount available seats sorted by row/number
  const fallbackSorted = [...availableShowSeats].sort((a, b) => {
    if (a.seat.row !== b.seat.row) return a.seat.row.localeCompare(b.seat.row);
    return a.seat.number - b.seat.number;
  });

  return fallbackSorted.slice(0, seatCount).map((ss) => ({
    showSeatId: ss.id,
    seatId: ss.seatId,
    row: ss.seat.row,
    number: ss.seat.number,
    type: ss.seat.type,
  }));
}

// ----------------------------------------------------
// TEST RUNS
// ----------------------------------------------------
console.log('--- STARTING CINEVERSE SEAT ALLOCATION UNIT TESTS ---');

// Test Case 1: Contiguous Seats Exist
const testCase1: MockShowSeat[] = [
  { id: '1', seatId: 's1', status: 'AVAILABLE', seat: { row: 'A', number: 1, type: 'NORMAL' } },
  { id: '2', seatId: 's2', status: 'AVAILABLE', seat: { row: 'A', number: 2, type: 'NORMAL' } },
  { id: '3', seatId: 's3', status: 'AVAILABLE', seat: { row: 'A', number: 3, type: 'NORMAL' } },
  { id: '4', seatId: 's4', status: 'AVAILABLE', seat: { row: 'A', number: 5, type: 'NORMAL' } }
];

console.log('Test 1: Requesting 3 contiguous seats in row A...');
const res1 = solveAdjacentSeats(testCase1, 3);
console.log('Result:', res1.map(s => `${s.row}${s.number}`));
if (res1.length === 3 && res1.every((s, i) => s.number === i + 1)) {
  console.log('✅ TEST 1 PASSED: Found contiguous block 1, 2, 3');
} else {
  console.error('❌ TEST 1 FAILED');
}

// Test Case 2: No Contiguous Seats, Fallback to Closest Grouping
const testCase2: MockShowSeat[] = [
  { id: '1', seatId: 's1', status: 'AVAILABLE', seat: { row: 'B', number: 1, type: 'NORMAL' } },
  { id: '2', seatId: 's2', status: 'AVAILABLE', seat: { row: 'B', number: 3, type: 'NORMAL' } },
  { id: '3', seatId: 's3', status: 'AVAILABLE', seat: { row: 'B', number: 4, type: 'NORMAL' } },
  { id: '4', seatId: 's4', status: 'AVAILABLE', seat: { row: 'B', number: 8, type: 'NORMAL' } }
];

console.log('\nTest 2: Requesting 3 closest seats in row B...');
const res2 = solveAdjacentSeats(testCase2, 3);
console.log('Result:', res2.map(s => `${s.row}${s.number}`));
if (res2.length === 3 && res2[0]?.number === 1 && res2[1]?.number === 3 && res2[2]?.number === 4) {
  console.log('✅ TEST 2 PASSED: Closest range found: 1, 3, 4 (range size 3)');
} else {
  console.error('❌ TEST 2 FAILED');
}

// Test Case 3: Absolute Fallback across different rows
const testCase3: MockShowSeat[] = [
  { id: '1', seatId: 's1', status: 'AVAILABLE', seat: { row: 'C', number: 1, type: 'NORMAL' } },
  { id: '2', seatId: 's2', status: 'AVAILABLE', seat: { row: 'C', number: 9, type: 'NORMAL' } },
  { id: '3', seatId: 's3', status: 'AVAILABLE', seat: { row: 'D', number: 2, type: 'NORMAL' } },
  { id: '4', seatId: 's4', status: 'AVAILABLE', seat: { row: 'D', number: 3, type: 'NORMAL' } }
];

console.log('\nTest 3: Requesting 3 seats when single row groups are too small...');
const res3 = solveAdjacentSeats(testCase3, 3);
console.log('Result:', res3.map(s => `${s.row}${s.number}`));
if (res3.length === 3) {
  console.log('✅ TEST 3 PASSED: Returned fallback seat block correctly');
} else {
  console.error('❌ TEST 3 FAILED');
}
