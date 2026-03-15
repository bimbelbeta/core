import { MemoryRatelimiter } from "@orpc/experimental-ratelimit/memory";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export function createFreeRatelimiter() {
	return new MemoryRatelimiter({
		maxRequests: 100,
		window: FIFTEEN_MINUTES_MS,
	});
}

export function createPremiumRatelimiter() {
	return new MemoryRatelimiter({
		maxRequests: 500,
		window: FIFTEEN_MINUTES_MS,
	});
}

let _freeRatelimiter: MemoryRatelimiter | undefined;
let _premiumRatelimiter: MemoryRatelimiter | undefined;

export function getFreeRatelimiter() {
	_freeRatelimiter ??= createFreeRatelimiter();
	return _freeRatelimiter;
}

export function getPremiumRatelimiter() {
	_premiumRatelimiter ??= createPremiumRatelimiter();
	return _premiumRatelimiter;
}
