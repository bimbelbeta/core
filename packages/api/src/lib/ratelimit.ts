import { MemoryRatelimiter } from "@orpc/experimental-ratelimit/memory";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export const freeRatelimiter = new MemoryRatelimiter({
	maxRequests: 100,
	window: FIFTEEN_MINUTES_MS,
});

export const premiumRatelimiter = new MemoryRatelimiter({
	maxRequests: 500,
	window: FIFTEEN_MINUTES_MS,
});
