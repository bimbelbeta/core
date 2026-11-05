import { describe, expect, test } from "bun:test";
import { formatDateLong, formatDateMedium, formatDateTime, formatRelativeDate } from "./format-date";

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

	test("the day and week boundaries", () => {
		expect(formatRelativeDate(ago(6 * DAY))).toBe("6 hari lalu");
		expect(formatRelativeDate(ago(7 * DAY))).toBe("1 minggu lalu");
	});

	test("the month boundary does not produce 0 bulan for four-week ranges", () => {
		expect(formatRelativeDate(ago(27 * DAY))).toBe("3 minggu lalu");
		expect(formatRelativeDate(ago(28 * DAY))).toBe("4 minggu lalu");
		expect(formatRelativeDate(ago(29 * DAY))).toBe("4 minggu lalu");
		expect(formatRelativeDate(ago(30 * DAY))).toBe("1 bulan lalu");
	});

	test("the year boundary", () => {
		expect(formatRelativeDate(ago(359 * DAY))).toBe("11 bulan lalu");
		expect(formatRelativeDate(ago(365 * DAY))).toBe("1 tahun lalu");
	});
});

describe("formatDateTime", () => {
	test("keeps the time of day", () => {
		const result = formatDateTime(new Date("2026-11-04T17:13:00"));
		expect(result).toContain("2026");
		expect(result).toMatch(/17[.:]13/);
	});

	test("uses the long month, unlike formatDateMedium", () => {
		const date = new Date("2026-11-04T17:13:00");
		expect(formatDateTime(date)).not.toBe(formatDateMedium(date));
		expect(formatDateTime(date).length).toBeGreaterThan(formatDateMedium(date).length);
	});
});
