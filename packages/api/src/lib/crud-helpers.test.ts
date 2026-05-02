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

	test("throws INTERNAL_SERVER_ERROR when first element is falsy", () => {
		expect(() => requireCreated([null], "entity", errors)).toThrow("Gagal membuat entity");
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

	test("throws NOT_FOUND when first element is falsy", () => {
		expect(() => requireFound([null], "entity", errors)).toThrow("entity tidak ditemukan");
	});
});
