import { describe, expect, test } from "bun:test";
import { createAdminBypassRatelimiter, createFreeRatelimiter, createPremiumRatelimiter } from "./rate-limiter";

describe("rate limiter config", () => {
	test("free limiter is highly lenient", async () => {
		const limiter = createFreeRatelimiter();
		const result = await limiter.limit("free");
		expect(result.limit).toBe(5000);
		expect(result.remaining).toBe(4999);
	});

	test("premium limiter is highly lenient", async () => {
		const limiter = createPremiumRatelimiter();
		const result = await limiter.limit("premium");
		expect(result.limit).toBe(20000);
		expect(result.remaining).toBe(19999);
	});

	test("admin bypass limiter effectively disables rate limiting", async () => {
		const limiter = createAdminBypassRatelimiter();
		const result = await limiter.limit("admin");
		expect(result.limit).toBe(Number.MAX_SAFE_INTEGER);
		expect(result.remaining).toBe(Number.MAX_SAFE_INTEGER - 1);
	});
});
