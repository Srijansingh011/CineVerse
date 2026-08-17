import { describe, it, expect } from 'vitest';

// ── Refund Policy ─────────────────────────────────────────────────
function calculateRefund(totalAmount: number, hoursBeforeShow: number): number {
  if (hoursBeforeShow > 24) return totalAmount;
  if (hoursBeforeShow >= 6) return totalAmount * 0.75;
  if (hoursBeforeShow >= 2) return totalAmount * 0.5;
  return 0;
}

describe('Refund Policy Engine', () => {
  it('refunds 100% when cancelled > 24h before show', () => {
    expect(calculateRefund(1000, 25)).toBe(1000);
  });
  it('refunds 75% when cancelled 6–24h before show', () => {
    expect(calculateRefund(1000, 12)).toBe(750);
  });
  it('refunds 50% when cancelled 2–6h before show', () => {
    expect(calculateRefund(1000, 4)).toBe(500);
  });
  it('refunds 0% when cancelled < 2h before show', () => {
    expect(calculateRefund(1000, 1)).toBe(0);
  });
});

// ── Recommendation Scoring ────────────────────────────────────────
function scoreRecommendation(input: {
  ratingHistory: number;
  genreMatch: number;
  friendLikes: number;
  isShowing: boolean;
}): number {
  return (
    input.ratingHistory * 40 +
    input.genreMatch * 30 +
    input.friendLikes * 20 +
    (input.isShowing ? 10 : 0)
  );
}

describe('Recommendation Scoring', () => {
  it('scores a perfect match at 100', () => {
    expect(scoreRecommendation({ ratingHistory: 1, genreMatch: 1, friendLikes: 1, isShowing: true })).toBe(100);
  });
  it('gives 0 for no signals', () => {
    expect(scoreRecommendation({ ratingHistory: 0, genreMatch: 0, friendLikes: 0, isShowing: false })).toBe(0);
  });
  it('gives showing bonus correctly', () => {
    const withShowing = scoreRecommendation({ ratingHistory: 0, genreMatch: 0, friendLikes: 0, isShowing: true });
    const without = scoreRecommendation({ ratingHistory: 0, genreMatch: 0, friendLikes: 0, isShowing: false });
    expect(withShowing - without).toBe(10);
  });
});

// ── XP Level Calculation ──────────────────────────────────────────
function calculateLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

function xpForNextLevel(level: number): number {
  return level * 500;
}

describe('Gamification XP Logic', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });
  it('reaches level 2 at 500 XP', () => {
    expect(calculateLevel(500)).toBe(2);
  });
  it('reaches level 5 at 2000 XP', () => {
    expect(calculateLevel(2000)).toBe(5);
  });
  it('calculates next level XP threshold', () => {
    expect(xpForNextLevel(1)).toBe(500);
    expect(xpForNextLevel(3)).toBe(1500);
  });
});

// ── Adjacent Seat Solver ──────────────────────────────────────────
interface Seat { row: string; number: number; available: boolean }

function findAdjacentSeats(seats: Seat[], count: number): Seat[] | null {
  const rowGroups: Record<string, Seat[]> = {};
  for (const s of seats) {
    if (!rowGroups[s.row]) rowGroups[s.row] = [];
    rowGroups[s.row]!.push(s);
  }

  for (const row of Object.keys(rowGroups).sort()) {
    const available = rowGroups[row]!
      .filter((s) => s.available)
      .sort((a, b) => a.number - b.number);

    // Sliding window for consecutive seats
    for (let i = 0; i <= available.length - count; i++) {
      const window = available.slice(i, i + count);
      const isConsecutive = window.every(
        (s, idx) => idx === 0 || s.number === window[idx - 1]!.number + 1,
      );
      if (isConsecutive) return window;
    }
  }
  return null;
}

describe('Adjacent Seat Solver', () => {
  const seats: Seat[] = [
    { row: 'A', number: 1, available: true },
    { row: 'A', number: 2, available: false },
    { row: 'A', number: 3, available: true },
    { row: 'B', number: 1, available: true },
    { row: 'B', number: 2, available: true },
    { row: 'B', number: 3, available: true },
    { row: 'B', number: 4, available: true },
  ];

  it('finds 3 consecutive seats in row B', () => {
    const result = findAdjacentSeats(seats, 3);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);
    expect(result![0]!.row).toBe('B');
  });

  it('returns null when not enough consecutive seats exist', () => {
    const result = findAdjacentSeats(seats, 5);
    expect(result).toBeNull();
  });
});
