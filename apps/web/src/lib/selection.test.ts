import { describe, expect, test } from "bun:test";
import { resolveBulkSelection, shouldClearSelection } from "./selection";

describe("shouldClearSelection", () => {
	test("keeps the selection when infinite scroll appends rows", () => {
		expect(shouldClearSelection([1, 2], [1, 2, 3])).toBe(false);
		expect(shouldClearSelection([1, 2, 3], [1, 2, 3, 4, 5])).toBe(false);
	});

	test("clears when pagination replaces the row set", () => {
		expect(shouldClearSelection([1, 2], [3, 4])).toBe(true);
	});

	test("clears when a filter narrows to a set that is not an extension", () => {
		expect(shouldClearSelection([1, 2, 3], [2, 3])).toBe(true);
	});

	test("clears when an append also reorders", () => {
		expect(shouldClearSelection([1, 2], [2, 1, 3])).toBe(true);
	});

	test("does nothing on the first render", () => {
		expect(shouldClearSelection([], [1, 2])).toBe(false);
	});

	test("does nothing when the row set is unchanged", () => {
		expect(shouldClearSelection([1, 2, 3], [1, 2, 3])).toBe(false);
	});
});

describe("resolveBulkSelection", () => {
	test("advances the shown set so the next render is judged against it", () => {
		expect(resolveBulkSelection([1, 2], [1], [1, 2, 3]).shown).toEqual([1, 2, 3]);
	});

	test("keeps the selection across an append", () => {
		expect(resolveBulkSelection([1, 2], [1, 2], [1, 2, 3]).selected).toEqual([1, 2]);
	});

	test("clears the selection when the page changes", () => {
		expect(resolveBulkSelection([1, 2], [1, 2], [3, 4]).selected).toEqual([]);
	});

	test("a shown set that never advances keeps a stale selection", () => {
		const first = resolveBulkSelection([], [], [1, 2]);
		expect(first.selected).toEqual([]);
		expect(resolveBulkSelection(first.shown, [1, 2], [3, 4]).selected).toEqual([]);
	});
});
