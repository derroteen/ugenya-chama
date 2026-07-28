type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart >= WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(ip: string, action: string, limit: number) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const normalizedIp = ip.trim() || "unknown";
  const normalizedAction = action.trim() || "unknown_action";
  const key = `${normalizedIp}:${normalizedAction}`;

  const existing = rateLimitStore.get(key);
  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
  };
}
