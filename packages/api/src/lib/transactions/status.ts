import { db } from "@bimbelbeta/db";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import { eq } from "drizzle-orm";

export async function updateTransactionStatus(orderId: string, status: "failed" | "pending"): Promise<void> {
	await db.update(transaction).set({ status }).where(eq(transaction.id, orderId));
}
