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
	test("reports no change for an equal set of equal ids, whatever the array identity", () => {
		expect(resolveBulkSelection([1, 2, 3], [], [1, 2, 3])).toBeNull();
	});

	test("advances the shown set so the next call is judged against it", () => {
		expect(resolveBulkSelection([1, 2], [1], [1, 2, 3])?.shown).toEqual([1, 2, 3]);
	});

	test("keeps the selection across an append", () => {
		expect(resolveBulkSelection([1, 2], [1, 2], [1, 2, 3])?.selected).toEqual([1, 2]);
	});

	test("clears the selection when the page changes", () => {
		expect(resolveBulkSelection([1, 2], [1, 2], [3, 4])?.selected).toEqual([]);
	});
});

describe("resolveBulkSelection with keepSelection", () => {
	test("keeps the selection when a search narrows the row set", () => {
		expect(resolveBulkSelection([1, 2], [1, 2], [2], true)?.selected).toEqual([1, 2]);
	});

	test("keeps the selection when the row set briefly empties", () => {
		expect(resolveBulkSelection([1, 2], [1], [], true)?.selected).toEqual([1]);
	});

	test("still advances the shown set", () => {
		expect(resolveBulkSelection([1], [1], [2, 3], true)?.shown).toEqual([2, 3]);
	});

	test("does not change the clearing default", () => {
		expect(resolveBulkSelection([1, 2], [1, 2], [3, 4])?.selected).toEqual([]);
	});
});
