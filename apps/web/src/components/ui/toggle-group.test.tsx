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
	KeyboardEvent: dom.window.KeyboardEvent,
	getComputedStyle: dom.window.getComputedStyle,
});
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

const { act, cleanup, render } = await import("@testing-library/react");
const { createElement } = await import("react");
const { ToggleGroup, ToggleGroupItem } = await import("@/components/ui/toggle-group");

afterEach(cleanup);

const VALUES = ["all", "sd", "smp"];

function renderGroup(disabled?: string) {
	const changes: string[] = [];
	render(
		createElement(
			ToggleGroup,
			{
				type: "single",
				defaultValue: "all",
				onValueChange: (next: string) => changes.push(next),
				"aria-label": "Kategori kelas",
			},
			VALUES.map((v) => createElement(ToggleGroupItem, { key: v, value: v, disabled: v === disabled }, v)),
		),
	);
	return changes;
}

const radios = () => [...document.querySelectorAll<HTMLElement>('[role="radio"]')];
const focusedIndex = () => {
	const active = document.activeElement;
	return active instanceof HTMLElement ? radios().indexOf(active) : -1;
};
const checked = () =>
	radios()
		.filter((radio) => radio.getAttribute("data-state") === "on")
		.map((radio) => radio.textContent);

async function press(key: string) {
	await act(async () => {
		document.activeElement?.dispatchEvent(
			new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
		);
		await new Promise((resolve) => setTimeout(resolve, 10));
	});
}

describe("ToggleGroup single", () => {
	test("announces itself as a radiogroup", () => {
		renderGroup();
		expect(document.querySelector('[role="radiogroup"]')?.getAttribute("aria-label")).toBe("Kategori kelas");
		expect(radios()).toHaveLength(VALUES.length);
	});

	test("arrows move the selection, not only the focus", async () => {
		renderGroup();
		radios()[0].focus();
		await press("ArrowRight");
		expect(checked()).toEqual(["sd"]);
		expect(focusedIndex()).toBe(1);
		await press("ArrowRight");
		expect(checked()).toEqual(["smp"]);
	});

	test("wraps at both ends", async () => {
		renderGroup();
		radios()[2].focus();
		await press("ArrowRight");
		expect(focusedIndex()).toBe(0);
		radios()[0].focus();
		await press("ArrowLeft");
		expect(focusedIndex()).toBe(2);
	});

	test("Home, End, PageUp and PageDown jump to an end", async () => {
		renderGroup();
		radios()[1].focus();
		await press("End");
		expect(focusedIndex()).toBe(2);
		expect(checked()).toEqual(["smp"]);
		await press("Home");
		expect(focusedIndex()).toBe(0);
		expect(checked()).toEqual(["all"]);
		await press("PageDown");
		expect(focusedIndex()).toBe(2);
		expect(checked()).toEqual(["smp"]);
		await press("PageUp");
		expect(focusedIndex()).toBe(0);
		expect(checked()).toEqual(["all"]);
	});

	test("skips a disabled item", async () => {
		renderGroup("sd");
		radios()[0].focus();
		await press("ArrowRight");
		expect(focusedIndex()).toBe(2);
	});

	test("leaves modifier chords to the browser", async () => {
		const changes = renderGroup();
		radios()[0].focus();
		await act(async () => {
			document.activeElement?.dispatchEvent(
				new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true, cancelable: true }),
			);
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
		expect(changes).toEqual([]);
	});
});
