import { describe, expect, test } from "bun:test";
import { buildUsersSearch } from "./-utils";

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
