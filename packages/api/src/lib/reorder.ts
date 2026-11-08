import type { DbClient } from "@bimbelbeta/db";
import { type SQL, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

export async function reorderRows(
	client: DbClient,
	options: {
		table: PgTable;
		idColumn: PgColumn;
		where: SQL | undefined;
		items: { id: number; order: number }[];
		touchUpdatedAt?: boolean;
	},
): Promise<void> {
	const { table, idColumn, where, items, touchUpdatedAt } = options;
	if (items.length === 0) return;

	const caseExpr = sql.join(
		items.map((item) => sql`WHEN ${idColumn} = ${item.id} THEN ${item.order}::int`),
		sql` `,
	);
	const timestamp = touchUpdatedAt ? { updatedAt: new Date() } : {};

	await client.transaction(async (tx) => {
		await tx
			.update(table)
			.set({ order: sql`-${idColumn}`, ...timestamp })
			.where(where);
		await tx
			.update(table)
			.set({ order: sql`CASE ${caseExpr} END`, ...timestamp })
			.where(where);
	});
}
