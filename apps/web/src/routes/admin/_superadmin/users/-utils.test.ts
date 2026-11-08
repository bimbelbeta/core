import { describe, expect, test } from "bun:test";
import { buildUsersSearch, formatPremiumExpiry } from "./-utils";

describe("buildUsersSearch", () => {
	test("omits empty filters and keeps limit", () => {
		expect(buildUsersSearch({ limit: 10 })).toEqual({ limit: 10 });
	});

	test("keeps isPremium false, which a truthiness check would drop", () => {
		expect(buildUsersSearch({ isPremium: false, limit: 10 })).toEqual({ isPremium: false, limit: 10 });
	});

	test("carries every provided filter", () => {
		expect(buildUsersSearch({ search: "ana", role: "admin", isPremium: true, limit: 5 })).toEqual({
			search: "ana",
			role: "admin",
			isPremium: true,
			limit: 5,
		});
	});
});

describe("formatPremiumExpiry", () => {
	const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

	test("reads the near buckets in Indonesian", () => {
		expect(formatPremiumExpiry(inDays(-1))).toBe("Kedaluwarsa");
		expect(formatPremiumExpiry(inDays(0))).toBe("Hari ini");
		expect(formatPremiumExpiry(inDays(1))).toBe("Besok");
		expect(formatPremiumExpiry(inDays(3))).toBe("3 hari lagi");
		expect(formatPremiumExpiry(inDays(14))).toBe("2 minggu lagi");
	});

	test("never reports more than eleven months", () => {
		expect(formatPremiumExpiry(inDays(359))).toBe("11 bulan lagi");
		expect(formatPremiumExpiry(inDays(360))).toBe("1 tahun lagi");
		expect(formatPremiumExpiry(inDays(365))).toBe("1 tahun lagi");
		expect(formatPremiumExpiry(inDays(730))).toBe("2 tahun lagi");
	});
});
