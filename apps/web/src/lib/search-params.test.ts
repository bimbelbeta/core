import { describe, expect, test } from "bun:test";
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
