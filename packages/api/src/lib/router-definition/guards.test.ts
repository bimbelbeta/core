import { describe, expect, test } from "bun:test";
import { assertAdmin, assertSuperAdmin, isPremiumExpired } from "./guards";

const errors = {
	UNAUTHORIZED: () => new Error("UNAUTHORIZED"),
};

describe("assertAdmin", () => {
	test("accepts admin and superadmin", () => {
		expect(() => assertAdmin("admin", errors)).not.toThrow();
		expect(() => assertAdmin("superadmin", errors)).not.toThrow();
	});

	test("rejects users and missing roles", () => {
		expect(() => assertAdmin("user", errors)).toThrow("UNAUTHORIZED");
		expect(() => assertAdmin(undefined, errors)).toThrow("UNAUTHORIZED");
	});
});

describe("assertSuperAdmin", () => {
	test("accepts only superadmin", () => {
		expect(() => assertSuperAdmin("superadmin", errors)).not.toThrow();
		expect(() => assertSuperAdmin("admin", errors)).toThrow("UNAUTHORIZED");
	});
});

describe("isPremiumExpired", () => {
	const now = Date.now();

	test("is false when the user is not premium", () => {
		expect(isPremiumExpired({ isPremium: false, premiumExpiresAt: new Date(now - 1000) }, now)).toBe(false);
	});

	test("is false when premium has not expired", () => {
		expect(isPremiumExpired({ isPremium: true, premiumExpiresAt: new Date(now + 100_000) }, now)).toBe(false);
	});

	test("is false when there is no expiry", () => {
		expect(isPremiumExpired({ isPremium: true, premiumExpiresAt: null }, now)).toBe(false);
	});

	test("is true when premium has expired", () => {
		expect(isPremiumExpired({ isPremium: true, premiumExpiresAt: new Date(now - 100_000) }, now)).toBe(true);
	});
});
