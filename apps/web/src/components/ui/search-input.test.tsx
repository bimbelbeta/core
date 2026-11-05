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

const { act, cleanup, render } = await import("@testing-library/react");
const { createElement } = await import("react");
const { SearchInput } = await import("./search-input");

afterEach(cleanup);

const settle = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

function renderSearch() {
	const calls: string[] = [];
	const { container } = render(
		createElement(SearchInput, {
			value: "",
			onChange: (value: string) => calls.push(value),
			debounceMs: 30,
		}),
	);
	const input = container.querySelector("input");
	if (!input) throw new Error("no input");
	return { calls, input };
}

async function type(input: HTMLInputElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
	await act(async () => {
		setter?.call(input, value);
		input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
	});
}

describe("SearchInput", () => {
	test("debounces typing into one call", async () => {
		const { calls, input } = renderSearch();
		await type(input, "ab");
		await type(input, "abc");
		expect(calls).toEqual([]);
		await act(async () => {
			await settle(60);
		});
		expect(calls).toEqual(["abc"]);
	});

	test("clearing within the debounce window does not re-apply the stale query", async () => {
		const { calls, input } = renderSearch();
		await type(input, "abc");

		const clear = document.querySelector('button[aria-label="Hapus pencarian"]');
		expect(clear).toBeInstanceOf(dom.window.HTMLButtonElement);
		await act(async () => {
			if (clear instanceof dom.window.HTMLButtonElement) clear.click();
		});

		await act(async () => {
			await settle(60);
		});
		expect(calls).toEqual([""]);
		expect(input.value).toBe("");
	});
});
