import { describe, expect, test } from "bun:test";
import { canAccessContent, isFirstContent, isFirstSubject } from "@bimbelbeta/contract/common/content-access";

describe("canAccessContent", () => {
	// ─── role bypass ─────────────────────────────────────────────────────────────
	test("admin can access any content regardless of premium status or order", () => {
		expect(canAccessContent(false, "admin", 5, 5)).toBe(true);
		expect(canAccessContent(false, "admin", 1, 1)).toBe(true);
	});

	test("superadmin can access any content regardless of premium status or order", () => {
		expect(canAccessContent(false, "superadmin", 5, 5)).toBe(true);
		expect(canAccessContent(false, "superadmin", 1, 1)).toBe(true);
	});

	// ─── premium bypass ───────────────────────────────────────────────────────────
	test("premium user can access any content", () => {
		expect(canAccessContent(true, "user", 5, 5)).toBe(true);
		expect(canAccessContent(true, "user", 2, 3)).toBe(true);
		expect(canAccessContent(true, undefined, 3, 3)).toBe(true);
	});

	// ─── free user access ─────────────────────────────────────────────────────────
	test("free user can access first content of first subject", () => {
		expect(canAccessContent(false, "user", 1, 1)).toBe(true);
	});

	test("free user cannot access non-first subject", () => {
		expect(canAccessContent(false, "user", 2, 1)).toBe(false);
		expect(canAccessContent(false, "user", 3, 1)).toBe(false);
	});

	test("free user cannot access non-first content even on first subject", () => {
		expect(canAccessContent(false, "user", 1, 2)).toBe(false);
		expect(canAccessContent(false, "user", 1, 3)).toBe(false);
	});

	test("free user with undefined role behaves like regular free user", () => {
		expect(canAccessContent(false, undefined, 1, 1)).toBe(true);
		expect(canAccessContent(false, undefined, 2, 1)).toBe(false);
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
