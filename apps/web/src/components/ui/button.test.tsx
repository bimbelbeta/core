import { afterEach, expect, test } from "bun:test";
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
const { cleanup, fireEvent, render } = await import("@testing-library/react");
const { Button } = await import("./button");
afterEach(cleanup);

test("pending disables clicks and restores the label and enabled state on completion", () => {
	let clicks = 0;
	const view = (isPending: boolean, disabled = false) => (
		<Button isPending={isPending} disabled={disabled} pendingText="Menyimpan" onClick={() => clicks++}>
			Simpan
		</Button>
	);
	const { getByRole, getByText, rerender } = render(view(false));
	const button = getByRole("button", { name: "Simpan" });
	fireEvent.click(button);
	expect(clicks).toBe(1);
	rerender(view(true));
	expect(button.hasAttribute("disabled")).toBe(true);
	expect(button.getAttribute("aria-busy")).toBe("true");
	expect(getByText("Simpan").className).toContain("opacity-0");
	expect(getByText("Menyimpan").className).toContain("opacity-100");
	fireEvent.click(button);
	expect(clicks).toBe(1);
	rerender(view(false));
	expect(button.hasAttribute("disabled")).toBe(false);
	expect(button.hasAttribute("aria-busy")).toBe(false);
	expect(getByText("Simpan").className).toContain("opacity-100");
	rerender(view(false, true));
	expect(button.hasAttribute("disabled")).toBe(true);
});
