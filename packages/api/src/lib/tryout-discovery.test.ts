import { Database } from "bun:sqlite";
import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { drizzle } from "drizzle-orm/pg-proxy";
import { discoverTryouts } from "./tryout-discovery";

const sqlite = new Database(":memory:");
sqlite.run(
	"CREATE TABLE tryout (id INTEGER PRIMARY KEY, title TEXT, passing_grade INTEGER, starts_at TEXT, ends_at TEXT, category TEXT, status TEXT)",
);
sqlite.run("CREATE TABLE tryout_attempt (id INTEGER PRIMARY KEY, tryout_id INTEGER, user_id TEXT, status TEXT)");
const proxy = drizzle(async (query, params) => ({
	rows: sqlite
		.query(query.replace(/"app"\./g, "").replace(/\$\d+/g, "?"))
		.values(
			...params.map((value) =>
				typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value) ? value.replace("T", " ").replace("Z", "") : value,
			),
		)
		.map((row) =>
			row.map((value) =>
				typeof value === "string" && /^\d{4}-\d\d-\d\d /.test(value) ? new Date(`${value.replace(" ", "T")}Z`) : value,
			),
		),
}));
const select = spyOn(db, "select").mockImplementation(proxy.select.bind(proxy));

afterAll(() => {
	select.mockRestore();
	sqlite.close();
});

describe("tryout discovery", () => {
	test("filters before paging and traverses dated, tied and undated tryouts in both directions", async () => {
		const insert = sqlite.prepare("INSERT INTO tryout VALUES (?, ?, 600, ?, ?, ?, ?)");
		insert.run(1, "Old", "2020-01-01 00:00:00.000", "2020-02-01 00:00:00.000", "sd", "published");
		insert.run(2, "Tie one", "2999-01-01 00:00:00.000", null, "smp", "published");
		insert.run(3, "Tie two", "2999-01-01 00:00:00.000", null, "sma", "published");
		insert.run(4, "Undated", null, null, "sd", "published");
		insert.run(5, "Other level", "2999-02-01 00:00:00.000", null, "utbk", "published");
		insert.run(6, "Draft", "2999-02-01 00:00:00.000", null, "sd", "draft");

		const first = await discoverTryouts({ level: "tka", limit: 2 }, "student");
		expect(first.items.map((item) => item.id)).toEqual([3, 2]);
		expect(first.items.map((item) => item.availability)).toEqual(["upcoming", "upcoming"]);
		const second = await discoverTryouts(
			{ level: "tka", limit: 2, after: first.pageInfo.endCursor ?? undefined },
			"student",
		);
		expect(second.items.map((item) => item.id)).toEqual([1, 4]);
		expect(second.items.map((item) => item.availability)).toEqual(["expired", "open"]);
		expect(second.pageInfo.hasNextPage).toBe(false);
		const previous = await discoverTryouts(
			{ level: "tka", limit: 2, before: second.pageInfo.startCursor ?? undefined },
			"student",
		);
		expect(previous.items.map((item) => item.id)).toEqual([3, 2]);
		const beforeUndated = await discoverTryouts(
			{ level: "tka", limit: 2, before: second.pageInfo.endCursor ?? undefined },
			"student",
		);
		expect(beforeUndated.items.map((item) => item.id)).toEqual([2, 1]);
		const afterUndated = await discoverTryouts(
			{ level: "tka", limit: 2, after: second.pageInfo.endCursor ?? undefined },
			"student",
		);
		expect(afterUndated.items).toEqual([]);
		const utbk = await discoverTryouts({ level: "utbk" }, "student");
		expect(utbk.items.map((item) => item.id)).toEqual([5]);
	});
});
