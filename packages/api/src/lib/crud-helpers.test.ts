import { describe, expect, test } from "bun:test";
import { requireCreated, requireFound } from "./crud-helpers";

describe("requireCreated", () => {
	const errors = {
		INTERNAL_SERVER_ERROR: ({ message }: { message: string }) => new Error(message),
	};

	test("returns first element when result has items", () => {
		const item = { id: 1, name: "test" };
		const result = requireCreated([item], "entity", errors);
		expect(result).toBe(item);
	});

	test("throws INTERNAL_SERVER_ERROR when result is empty array", () => {
		expect(() => requireCreated([], "entity", errors)).toThrow("Gagal membuat entity");
	});

	test("throws INTERNAL_SERVER_ERROR when result is undefined", () => {
		expect(() => requireCreated(undefined, "entity", errors)).toThrow("Gagal membuat entity");
	});

	test("returns first element even when falsy (0, false, empty string)", () => {
		expect(requireCreated([0], "entity", errors)).toBe(0);
		expect(requireCreated([false], "entity", errors)).toBe(false);
		expect(requireCreated([""], "entity", errors)).toBe("");
	});
});

describe("requireFound", () => {
	const errors = {
		NOT_FOUND: ({ message }: { message: string }) => new Error(message),
	};

	test("returns first element when result has items", () => {
		const item = { id: 1, name: "test" };
		const result = requireFound([item], "entity", errors);
		expect(result).toBe(item);
	});

	test("throws NOT_FOUND when result is empty array", () => {
		expect(() => requireFound([], "entity", errors)).toThrow("entity tidak ditemukan");
	});

	test("throws NOT_FOUND when result is undefined", () => {
		expect(() => requireFound(undefined, "entity", errors)).toThrow("entity tidak ditemukan");
	});

	test("returns first element even when falsy (0, false, empty string)", () => {
		expect(requireFound([0], "entity", errors)).toBe(0);
		expect(requireFound([false], "entity", errors)).toBe(false);
		expect(requireFound([""], "entity", errors)).toBe("");
	});
});
