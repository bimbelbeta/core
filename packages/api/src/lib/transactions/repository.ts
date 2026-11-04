import { db } from "@bimbelbeta/db";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { and, eq, isNull } from "drizzle-orm";
import type { TransactionWithProduct } from "@/lib/transactions/types";

type Database = Pick<typeof db, "select" | "insert" | "update">;

/**
 * Builds the payment repository over the given database connection.
 *
 * Accepts the shared connection or an open transaction, so callers can group these reads and
 * writes with other work in one atomic unit. The parameter is narrowed to the operations used
 * here because that is what makes a transaction handle satisfy it.
 */
export const createPaymentRepository = (database: Database) => ({
	async findProduct(slug: string) {
		const [plan] = await database.select().from(product).where(eq(product.slug, slug)).limit(1);
		return plan;
	},

	async createTransaction(data: typeof transaction.$inferInsert) {
		const [created] = await database.insert(transaction).values(data).returning();
		return created;
	},

	async findTransactionWithProduct(orderId: string): Promise<TransactionWithProduct | null> {
		const [result] = await database
			.select({
				tx: transaction,
				prodSlug: product.slug,
				prodVariant: product.variant,
				prodFixedExpiryMonth: product.fixedExpiryMonth,
				prodFixedExpiryDay: product.fixedExpiryDay,
				prodDurationDays: product.durationDays,
				prodCredits: product.credits,
			})
			.from(transaction)
			.innerJoin(product, eq(transaction.productId, product.id))
			.where(eq(transaction.id, orderId))
			.limit(1);

		return result || null;
	},

	async updateStatus(orderId: string, status: "failed" | "pending") {
		await database
			.update(transaction)
			.set({ status })
			.where(and(eq(transaction.id, orderId), isNull(transaction.paidAt)));
	},
});

export const paymentRepository = createPaymentRepository(db);
