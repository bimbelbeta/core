import { describe, expect, test } from "bun:test";
import { isSubjectPremium } from "./premium-config";

describe("isSubjectPremium", () => {
	test("does not mark any subject as premium-only", () => {
		expect(isSubjectPremium(1, "user", false)).toBe(false);
		expect(isSubjectPremium(5, "user", false)).toBe(false);
		expect(isSubjectPremium(5, undefined, false)).toBe(false);
		expect(isSubjectPremium(5, "user", true)).toBe(false);
		expect(isSubjectPremium(5, "admin", false)).toBe(false);
	});
});
