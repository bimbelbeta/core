import { describe, expect, test } from "bun:test";
import { buildUsersSearch } from "../routes/admin/_superadmin/users/-utils";
import { withoutSearchKey } from "./tanstack-router-utils";

describe("withoutSearchKey", () => {
	test("drops only the named key", () => {
		expect(withoutSearchKey({ search: "abc", role: "admin", limit: 10 }, "search")).toEqual({
			role: "admin",
			limit: 10,
		});
	});

	test("is a no-op when the key is absent", () => {
		expect(withoutSearchKey({ limit: 10 }, "search")).toEqual({ limit: 10 });
	});
});

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
