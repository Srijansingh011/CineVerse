import { redis } from './redis.js';

/**
 * Atomically acquire locks for multiple seats using Lua script.
 * Returns true if all locks were successfully acquired, false otherwise.
 */
export async function acquireSeatLocks(
  showId: string,
  seatIds: string[],
  userId: string,
  expireSeconds: number
): Promise<boolean> {
  if (seatIds.length === 0) return true;
  
  const keys = seatIds.map((id) => `lock:show:${showId}:seat:${id}`);
  
  try {
    const result = await redis.eval(
      `
      local userId = ARGV[1]
      local expireSeconds = tonumber(ARGV[2])
      
      -- Check if any seat is already locked
      for i = 1, #KEYS do
          if redis.call('EXISTS', KEYS[i]) == 1 then
              return 0
          end
      end
      
      -- Lock all seats
      for i = 1, #KEYS do
          redis.call('SET', KEYS[i], userId, 'EX', expireSeconds)
      end
      
      return 1
      `,
      keys.length,
      ...keys,
      userId,
      expireSeconds
    );
    
    return result === 1;
  } catch (error) {
    console.error('Error acquiring Redis seat locks:', error);
    return false;
  }
}

/**
 * Atomically release locks for multiple seats using Lua script.
 */
export async function releaseSeatLocks(
  showId: string,
  seatIds: string[],
  userId: string
): Promise<boolean> {
  if (seatIds.length === 0) return true;

  const keys = seatIds.map((id) => `lock:show:${showId}:seat:${id}`);

  try {
    const result = await redis.eval(
      `
      local userId = ARGV[1]
      
      for i = 1, #KEYS do
          local val = redis.call('GET', KEYS[i])
          if val == userId then
              redis.call('DEL', KEYS[i])
          end
      end
      
      return 1
      `,
      keys.length,
      ...keys,
      userId
    );

    return result === 1;
  } catch (error) {
    console.error('Error releasing Redis seat locks:', error);
    return false;
  }
}
