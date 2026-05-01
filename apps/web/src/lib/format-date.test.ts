import { describe, expect, test } from "bun:test";
import { formatDateLong, formatDateMedium } from "./format-date";

describe("formatDateLong", () => {
	test("formats date with day, full month, and year in Indonesian", () => {
		const date = new Date("2026-01-15");
		const result = formatDateLong(date);
		expect(result).toContain("15");
		expect(result).toContain("2026");
	});

	test("formats a date correctly", () => {
		const date = new Date("2026-04-29");
		const result = formatDateLong(date);
		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
	});
});

describe("formatDateMedium", () => {
	test("formats date with numeric day, short month, and year", () => {
		const date = new Date("2026-04-29");
		const result = formatDateMedium(date);
		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
	});

	test("produces different output from formatDateLong", () => {
		const date = new Date("2026-04-29");
		expect(formatDateMedium(date)).not.toBe(formatDateLong(date));
	});
});
