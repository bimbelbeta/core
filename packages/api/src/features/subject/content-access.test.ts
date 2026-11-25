import { describe, expect, test } from "bun:test";
import { canAccessContent, isFirstContent, isFirstSubject } from "@bimbelbeta/contract/common/content-access";

describe("canAccessContent", () => {
	test("allows content for every premium state, role, subject, and content order", () => {
		expect(canAccessContent(false, "user", 1, 1)).toBe(true);
		expect(canAccessContent(false, "user", 5, 8)).toBe(true);
		expect(canAccessContent(false, undefined, 3, 4)).toBe(true);
		expect(canAccessContent(true, "user", 5, 8)).toBe(true);
		expect(canAccessContent(false, "admin", 5, 8)).toBe(true);
	});
});

describe("isFirstSubject", () => {
	test("returns true for order 1", () => {
		expect(isFirstSubject(1)).toBe(true);
	});

	test("returns false for order > 1", () => {
		expect(isFirstSubject(2)).toBe(false);
		expect(isFirstSubject(10)).toBe(false);
	});
});

describe("isFirstContent", () => {
	test("returns true for order 1", () => {
		expect(isFirstContent(1)).toBe(true);
	});

	test("returns false for order > 1", () => {
		expect(isFirstContent(2)).toBe(false);
		expect(isFirstContent(10)).toBe(false);
	});
});
