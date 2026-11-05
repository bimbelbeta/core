import { afterEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, {
	window: dom.window,
	document: dom.window.document,
	navigator: dom.window.navigator,
	HTMLElement: dom.window.HTMLElement,
	Element: dom.window.Element,
	Node: dom.window.Node,
	getComputedStyle: dom.window.getComputedStyle,
});
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

const { act, cleanup, renderHook } = await import("@testing-library/react");
const { useBulkSelection } = await import("./use-bulk-selection");

afterEach(cleanup);

const rows = (...ids: number[]) => ids.map((id) => ({ id }));

describe("useBulkSelection", () => {
	test("mounts with nothing selected", () => {
		const { result } = renderHook(({ items }) => useBulkSelection(items), {
			initialProps: { items: rows(1, 2) },
		});
		expect(result.current.selectedIds).toEqual([]);
	});

	test("keeps the selection when a page appends rows", () => {
		const { result, rerender } = renderHook(({ items }) => useBulkSelection(items), {
			initialProps: { items: rows(1, 2) },
		});
		act(() => result.current.toggleSelectOne(1));
		expect(result.current.selectedIds).toEqual([1]);

		rerender({ items: rows(1, 2, 3, 4) });
		expect(result.current.selectedIds).toEqual([1]);
	});

	test("keeps the selection across a narrowing search when asked", () => {
		const { result, rerender } = renderHook(({ items }) => useBulkSelection(items, { keepSelection: true }), {
			initialProps: { items: rows(1, 2) },
		});
		act(() => result.current.toggleSelectOne(1));
		rerender({ items: [] });
		expect(result.current.selectedIds).toEqual([1]);
		rerender({ items: rows(3) });
		expect(result.current.selectedIds).toEqual([1]);
	});

	test("clears the selection when the row set is replaced", () => {
		const { result, rerender } = renderHook(({ items }) => useBulkSelection(items), {
			initialProps: { items: rows(1, 2) },
		});
		act(() => result.current.toggleSelectAll());
		expect(result.current.selectedIds).toEqual([1, 2]);

		rerender({ items: rows(3, 4) });
		expect(result.current.selectedIds).toEqual([]);
	});

	test("does not re-render forever across equal row sets", () => {
		let renders = 0;
		const { rerender } = renderHook(
			({ items }) => {
				renders += 1;
				return useBulkSelection(items);
			},
			{ initialProps: { items: rows(1, 2) } },
		);
		rerender({ items: rows(1, 2) });
		rerender({ items: rows(1, 2) });
		expect(renders).toBeLessThan(6);
	});
});
