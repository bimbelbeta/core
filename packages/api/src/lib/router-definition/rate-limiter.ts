import type { Ratelimiter } from "@orpc/experimental-ratelimit";
import { MemoryRatelimiter } from "@orpc/experimental-ratelimit/memory";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export function createFreeRatelimiter() {
	return new MemoryRatelimiter({
		maxRequests: 2000,
		window: FIFTEEN_MINUTES_MS,
	});
}

export function createPremiumRatelimiter() {
	return new MemoryRatelimiter({
		maxRequests: 4000,
		window: FIFTEEN_MINUTES_MS,
	});
}

let _freeRatelimiter: MemoryRatelimiter | undefined;
let _premiumRatelimiter: MemoryRatelimiter | undefined;
let _noOpRatelimiter: Ratelimiter | undefined;

export function getFreeRatelimiter() {
	_freeRatelimiter ??= createFreeRatelimiter();
	return _freeRatelimiter;
}

export function getPremiumRatelimiter() {
	_premiumRatelimiter ??= createPremiumRatelimiter();
	return _premiumRatelimiter;
}

export function getNoOpRatelimiter(): Ratelimiter {
	_noOpRatelimiter ??= {
		limit: () =>
			Promise.resolve({
				success: true,
				remaining: Number.POSITIVE_INFINITY,
				limit: Number.POSITIVE_INFINITY,
				reset: 0,
			}),
	};
	return _noOpRatelimiter;
}
