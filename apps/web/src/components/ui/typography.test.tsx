import { afterEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import type * as React from "react";

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

const { cleanup, render } = await import("@testing-library/react");
const { createElement } = await import("react");
type ComponentProps<T extends React.ElementType> = import("react").ComponentProps<T>;
const { Typography } = await import("./typography");

afterEach(cleanup);

const renderVariant = (props: ComponentProps<typeof Typography>) => {
	const { container } = render(createElement(Typography, props, "teks"));
	return container.firstElementChild;
};

describe("Typography", () => {
	test("renders the element its variant names", () => {
		expect(renderVariant({ variant: "title" })?.tagName).toBe("H1");
		expect(renderVariant({ variant: "subtitle1" })?.tagName).toBe("H2");
		expect(renderVariant({ variant: "subtitle2" })?.tagName).toBe("H3");
		expect(renderVariant({ variant: "body" })?.tagName).toBe("P");
	});

	test("lets as override the element while keeping the variant's classes", () => {
		const node = renderVariant({ variant: "title", as: "h3" });
		expect(node?.tagName).toBe("H3");
		expect(node?.className).toContain("text-page-title");
	});

	test("applies the variant's default tone", () => {
		expect(renderVariant({ variant: "caption" })?.className).toContain("text-muted-foreground");
		expect(renderVariant({ variant: "body" })?.className).not.toContain("text-muted-foreground");
	});

	test("an explicit tone wins over the default", () => {
		expect(renderVariant({ variant: "caption", tone: "destructive" })?.className).toContain("text-red-200");
	});
});
