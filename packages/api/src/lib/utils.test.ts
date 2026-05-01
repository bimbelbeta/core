import { describe, expect, test } from "bun:test";
import { parseNullableInt, pickDefined } from "./utils";

describe("parseNullableInt", () => {
	test("returns number for numeric string", () => {
		expect(parseNullableInt("42")).toBe(42);
	});

	test("returns number for zero string", () => {
		expect(parseNullableInt("0")).toBe(0);
	});

	test("returns null for null input", () => {
		expect(parseNullableInt(null)).toBeNull();
	});

	test("returns null for empty string", () => {
		expect(parseNullableInt("")).toBeNull();
	});

	test("returns NaN for non-numeric string", () => {
		expect(parseNullableInt("abc")).toBeNaN();
	});

	test("returns number for negative string", () => {
		expect(parseNullableInt("-5")).toBe(-5);
	});

	test("returns number for float string", () => {
		expect(parseNullableInt("3.14")).toBe(3.14);
	});
});

describe("pickDefined", () => {
	test("removes undefined values", () => {
		const result = pickDefined({ a: 1, b: undefined, c: "hello" });
		expect(result).toEqual({ a: 1, c: "hello" });
	});

	test("keeps null values", () => {
		const result = pickDefined({ a: null, b: 1 });
		expect(result).toEqual({ a: null, b: 1 });
	});

	test("keeps falsy values except undefined", () => {
		const result = pickDefined({ a: 0, b: false, c: "", d: undefined });
		expect(result).toEqual({ a: 0, b: false, c: "" });
	});

	test("returns empty object when all values are undefined", () => {
		const result = pickDefined({ a: undefined, b: undefined });
		expect(result).toEqual({});
	});

	test("returns identical object when no undefined values", () => {
		const result = pickDefined({ x: 1, y: 2 });
		expect(result).toEqual({ x: 1, y: 2 });
	});
});
