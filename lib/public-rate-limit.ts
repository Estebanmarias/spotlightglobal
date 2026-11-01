import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const configured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const limiter = configured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "spotlight:public",
    })
  : null;

export function rateLimitDecision(
  success: boolean,
  isConfigured: boolean,
  isProduction: boolean,
) {
  if (!isConfigured) return { allowed: !isProduction, unavailable: true };
  return { allowed: success, unavailable: false };
}

export async function checkPublicRateLimit(
  request: Request,
  route: string,
): Promise<{ allowed: boolean; unavailable: boolean }> {
  if (!limiter) {
    return rateLimitDecision(false, false, process.env.NODE_ENV === "production");
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  try {
    const result = await limiter.limit(`${route}:${ip}`);
    return rateLimitDecision(result.success, true, process.env.NODE_ENV === "production");
  } catch (error) {
    console.error(`[${route.toUpperCase()}] Rate limiter unavailable:`, error);
    return rateLimitDecision(false, false, process.env.NODE_ENV === "production");
  }
}
