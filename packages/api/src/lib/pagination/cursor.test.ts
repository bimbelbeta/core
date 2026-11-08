import { describe, expect, test } from "bun:test";
import {
	buildIdCursorPage,
	buildStringIdCursorPage,
	createDateCursor,
	createIdCursor,
	createStringIdCursor,
	decodeCursor,
	decodePageInput,
	encodeCursor,
	parseDateCursor,
	parseIdCursor,
	parseStringIdCursor,
} from "./cursor";

describe("encodeCursor / decodeCursor", () => {
	test("round-trips a plain string", () => {
		const original = "hello world";
		expect(decodeCursor(encodeCursor(original))).toBe(original);
	});

	test("round-trips an ISO date string", () => {
		const iso = "2025-06-15T10:00:00.000Z";
		expect(decodeCursor(encodeCursor(iso))).toBe(iso);
	});

	test("round-trips an empty string", () => {
		expect(decodeCursor(encodeCursor(""))).toBe("");
	});

	test("encoded value differs from original", () => {
		const original = "abc";
		expect(encodeCursor(original)).not.toBe(original);
	});
});

describe("createIdCursor / parseIdCursor", () => {
	test("round-trips a positive integer", () => {
		expect(parseIdCursor(createIdCursor(42))).toBe(42);
	});

	test("round-trips id=1", () => {
		expect(parseIdCursor(createIdCursor(1))).toBe(1);
	});

	test("round-trips a large id", () => {
		expect(parseIdCursor(createIdCursor(9999999))).toBe(9999999);
	});
});

describe("createDateCursor / parseDateCursor", () => {
	test("round-trips a Date", () => {
		const date = new Date("2025-06-15T10:00:00.000Z");
		const cursor = createDateCursor(date);
		const parsed = parseDateCursor(cursor);
		expect(parsed.toISOString()).toBe(date.toISOString());
	});

	test("throws on invalid cursor", () => {
		const badCursor = encodeCursor("not-a-date");
		expect(() => parseDateCursor(badCursor)).toThrow("Invalid date cursor");
	});
});

describe("buildIdCursorPage", () => {
	const makeItems = (count: number) => Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

	test("forward: returns limit items when extra sentinel present", () => {
		const rows = makeItems(6); // fetched limit+1 = 6
		const { items, pageInfo } = buildIdCursorPage(rows, 5, false, false);
		expect(items).toHaveLength(5);
		expect(pageInfo.hasNextPage).toBe(true);
		expect(pageInfo.hasPreviousPage).toBe(false);
	});

	test("forward: hasNextPage=false when fewer rows than limit", () => {
		const rows = makeItems(3);
		const { items, pageInfo } = buildIdCursorPage(rows, 5, false, false);
		expect(items).toHaveLength(3);
		expect(pageInfo.hasNextPage).toBe(false);
	});

	test("forward with cursor: hasPreviousPage=true", () => {
		const rows = makeItems(3);
		const { pageInfo } = buildIdCursorPage(rows, 5, false, true);
		expect(pageInfo.hasPreviousPage).toBe(true);
	});

	test("backward: items are reversed", () => {
		const rows = makeItems(3); // ids: 1, 2, 3
		const { items } = buildIdCursorPage(rows, 5, true, false);
		expect(items.map((i) => i.id)).toEqual([3, 2, 1]);
	});

	test("backward: hasPreviousPage=true when extra sentinel present", () => {
		const rows = makeItems(6); // fetched limit+1
		const { pageInfo } = buildIdCursorPage(rows, 5, true, true);
		expect(pageInfo.hasPreviousPage).toBe(true);
		expect(pageInfo.hasNextPage).toBe(true); // hasCursor=true
	});

	test("startCursor and endCursor are set correctly", () => {
		const rows = makeItems(3); // ids: 1, 2, 3
		const { pageInfo } = buildIdCursorPage(rows, 5, false, false);
		expect(pageInfo.startCursor).toBe(createIdCursor(1));
		expect(pageInfo.endCursor).toBe(createIdCursor(3));
	});

	test("empty page: cursors are null", () => {
		const { pageInfo } = buildIdCursorPage([], 5, false, false);
		expect(pageInfo.startCursor).toBeNull();
		expect(pageInfo.endCursor).toBeNull();
		expect(pageInfo.hasNextPage).toBe(false);
		expect(pageInfo.hasPreviousPage).toBe(false);
	});
});

describe("createStringIdCursor / parseStringIdCursor", () => {
	test("round-trips a string id", () => {
		expect(parseStringIdCursor(createStringIdCursor("abc123"))).toBe("abc123");
	});

	test("round-trips a UUID", () => {
		const uuid = "550e8400-e29b-41d4-a716-446655440000";
		expect(parseStringIdCursor(createStringIdCursor(uuid))).toBe(uuid);
	});
});

describe("buildStringIdCursorPage", () => {
	const makeItems = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `id-${i + 1}` }));

	test("forward: returns limit items when extra sentinel present", () => {
		const rows = makeItems(6);
		const { items, pageInfo } = buildStringIdCursorPage(rows, 5, false, false);
		expect(items).toHaveLength(5);
		expect(pageInfo.hasNextPage).toBe(true);
		expect(pageInfo.hasPreviousPage).toBe(false);
	});

	test("forward: hasNextPage=false when fewer rows than limit", () => {
		const rows = makeItems(3);
		const { pageInfo } = buildStringIdCursorPage(rows, 5, false, false);
		expect(pageInfo.hasNextPage).toBe(false);
	});

	test("backward: items are reversed", () => {
		const rows = makeItems(3);
		const { items } = buildStringIdCursorPage(rows, 5, true, false);
		expect(items.map((i) => i.id)).toEqual(["id-3", "id-2", "id-1"]);
	});

	test("startCursor and endCursor use string id encoding", () => {
		const rows = makeItems(3);
		const { pageInfo } = buildStringIdCursorPage(rows, 5, false, false);
		expect(pageInfo.startCursor).toBe(createStringIdCursor("id-1"));
		expect(pageInfo.endCursor).toBe(createStringIdCursor("id-3"));
	});

	test("empty page: cursors are null", () => {
		const { pageInfo } = buildStringIdCursorPage([], 5, false, false);
		expect(pageInfo.startCursor).toBeNull();
		expect(pageInfo.endCursor).toBeNull();
	});

	test("custom key: cursors use the given row key", () => {
		const rows = Array.from({ length: 3 }, (_, i) => ({ usageId: `usage-${i + 1}`, userId: `user-${i + 1}` }));
		const { items, pageInfo } = buildStringIdCursorPage(rows, 5, false, false, "usageId");
		expect(items.map((i) => i.usageId)).toEqual(["usage-1", "usage-2", "usage-3"]);
		expect(pageInfo.startCursor).toBe(createStringIdCursor("usage-1"));
		expect(pageInfo.endCursor).toBe(createStringIdCursor("usage-3"));
	});

	test("custom key: backward pages reverse and keep the extra sentinel flags", () => {
		const rows = Array.from({ length: 4 }, (_, i) => ({ usageId: `usage-${i + 1}` }));
		const { items, pageInfo } = buildStringIdCursorPage(rows, 3, true, true, "usageId");
		expect(items.map((i) => i.usageId)).toEqual(["usage-3", "usage-2", "usage-1"]);
		expect(pageInfo.hasPreviousPage).toBe(true);
		expect(pageInfo.hasNextPage).toBe(true);
	});
});

describe("decodePageInput", () => {
	test("decodes a forward page with defaults", () => {
		expect(decodePageInput({})).toEqual({ limit: 20, backward: false, cursor: undefined, hasCursor: false });
	});

	test("decodes an undefined input", () => {
		expect(decodePageInput(undefined)).toEqual({ limit: 20, backward: false, cursor: undefined, hasCursor: false });
	});

	test("applies the requested limit and clamps it to a hundred", () => {
		expect(decodePageInput({ limit: 50 }).limit).toBe(50);
		expect(decodePageInput({ limit: 500 }).limit).toBe(100);
	});

	test("prefers the after cursor over the before cursor", () => {
		expect(decodePageInput({ after: "YQ" })).toEqual({
			limit: 20,
			backward: false,
			cursor: "YQ",
			hasCursor: true,
		});
	});

	test("marks a backward page from the before cursor", () => {
		expect(decodePageInput({ before: "YQ" })).toEqual({
			limit: 20,
			backward: true,
			cursor: "YQ",
			hasCursor: true,
		});
	});
});
