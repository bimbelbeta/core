import { describe, expect, test } from "bun:test";
import { ROLES } from "../roles";
import { resolveRatelimiterForUser } from "./middleware";

describe("resolveRatelimiterForUser", () => {
	test("returns bypass limiter for admin", async () => {
		const limiter = resolveRatelimiterForUser({
			role: ROLES.ADMIN,
			isPremium: false,
		});
		const result = await limiter.limit("admin");

		expect(result.limit).toBe(Number.MAX_SAFE_INTEGER);
	});

	test("returns bypass limiter for super admin", async () => {
		const limiter = resolveRatelimiterForUser({
			role: ROLES.SUPER_ADMIN,
			isPremium: false,
		});
		const result = await limiter.limit("superadmin");

		expect(result.limit).toBe(Number.MAX_SAFE_INTEGER);
	});

	test("returns premium limiter for premium user", async () => {
		const limiter = resolveRatelimiterForUser({
			role: ROLES.USER,
			isPremium: true,
		});
		const result = await limiter.limit("premium");

		expect(result.limit).toBe(20000);
	});

	test("returns free limiter for regular user", async () => {
		const limiter = resolveRatelimiterForUser({
			role: ROLES.USER,
			isPremium: false,
		});
		const result = await limiter.limit("free");

		expect(result.limit).toBe(5000);
	});
});
