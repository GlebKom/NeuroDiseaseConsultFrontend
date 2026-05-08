const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for API routes.
 * Returns `true` if the request should be blocked.
 */
export function isRateLimited(
  key: string,
  { maxRequests = 10, windowMs = 60_000 } = {}
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}
