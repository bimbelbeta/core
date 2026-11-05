import { describe, expect, test } from "bun:test";
import { formatDateLong, formatDateMedium, formatRelativeDate } from "./format-date";

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

describe("formatRelativeDate", () => {
	const ago = (ms: number) => new Date(Date.now() - ms);

	const MINUTE = 60 * 1000;
	const HOUR = 60 * MINUTE;
	const DAY = 24 * HOUR;

	test("under a minute reads as just now", () => {
		expect(formatRelativeDate(ago(30 * 1000))).toBe("Baru saja");
	});

	test("minutes and hours", () => {
		expect(formatRelativeDate(ago(5 * MINUTE))).toBe("5 menit lalu");
		expect(formatRelativeDate(ago(3 * HOUR))).toBe("3 jam lalu");
	});

	test("yesterday is named, not counted", () => {
		expect(formatRelativeDate(ago(DAY))).toBe("Kemarin");
	});

	test("days, weeks, months, years past the boundaries", () => {
		expect(formatRelativeDate(ago(3 * DAY))).toBe("3 hari lalu");
		expect(formatRelativeDate(ago(10 * DAY))).toBe("1 minggu lalu");
		expect(formatRelativeDate(ago(40 * DAY))).toBe("1 bulan lalu");
		expect(formatRelativeDate(ago(400 * DAY))).toBe("1 tahun lalu");
	});
});
