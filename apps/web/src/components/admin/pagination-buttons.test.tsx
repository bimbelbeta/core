import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PaginationButtons } from "./pagination-buttons";

const noop = () => {};

function render(hasPrevious: boolean, hasNext: boolean) {
	return renderToStaticMarkup(
		<PaginationButtons onPrevious={noop} onNext={noop} hasPrevious={hasPrevious} hasNext={hasNext} />,
	);
}

describe("PaginationButtons", () => {
	test("renders both controls disabled on a single page", () => {
		const html = render(false, false);
		expect(html).toContain("Navigasi halaman");
		expect(html).toContain("Sebelumnya");
		expect(html).toContain("Berikutnya");
		expect(html.match(/disabled=""/g)).toHaveLength(2);
	});

	test("keeps forward navigation available on the first page", () => {
		const html = render(false, true);
		expect(html).toContain("Sebelumnya");
		expect(html).toContain("Berikutnya");
		expect(html.match(/disabled=""/g)).toHaveLength(1);
	});

	test("keeps backward navigation available on an empty last page", () => {
		const html = render(true, false);
		expect(html).toContain("Navigasi halaman");
		expect(html.match(/disabled=""/g)).toHaveLength(1);
	});
});
