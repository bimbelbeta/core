import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminTableToolbar } from "./admin-table-toolbar";

const noop = () => {};

test("does not offer a reset for an unfiltered table", () => {
	const html = renderToStaticMarkup(<AdminTableToolbar searchValue="" onSearchChange={noop} />);
	expect(html).not.toContain("Hapus filter");
});

test("offers a reset when the table supplies active-filter handling", () => {
	const html = renderToStaticMarkup(<AdminTableToolbar searchValue="UTBK" onSearchChange={noop} onReset={noop} />);
	expect(html).toContain("Hapus filter");
});
