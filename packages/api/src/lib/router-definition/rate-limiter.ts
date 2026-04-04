import { MemoryRatelimiter } from "@orpc/experimental-ratelimit/memory";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export function createFreeRatelimiter() {
	return new MemoryRatelimiter({
		maxRequests: 5000,
		window: FIFTEEN_MINUTES_MS,
	});
}

export function createPremiumRatelimiter() {
	return new MemoryRatelimiter({
		maxRequests: 20000,
		window: FIFTEEN_MINUTES_MS,
	});
}

export function createAdminBypassRatelimiter() {
	return new MemoryRatelimiter({
		maxRequests: Number.MAX_SAFE_INTEGER,
		window: FIFTEEN_MINUTES_MS,
	});
}

let _freeRatelimiter: MemoryRatelimiter | undefined;
let _premiumRatelimiter: MemoryRatelimiter | undefined;
let _adminBypassRatelimiter: MemoryRatelimiter | undefined;

export function getFreeRatelimiter() {
	_freeRatelimiter ??= createFreeRatelimiter();
	return _freeRatelimiter;
}

export function getPremiumRatelimiter() {
	_premiumRatelimiter ??= createPremiumRatelimiter();
	return _premiumRatelimiter;
}

export function getAdminBypassRatelimiter() {
	_adminBypassRatelimiter ??= createAdminBypassRatelimiter();
	return _adminBypassRatelimiter;
}
