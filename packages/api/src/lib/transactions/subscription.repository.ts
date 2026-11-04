import { db } from "@bimbelbeta/db";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { eq } from "drizzle-orm";

export const createSubscriptionRepository = (database: Pick<typeof db, "select" | "insert">) => ({
	async findProduct(slug: string) {
		const [plan] = await database.select().from(product).where(eq(product.slug, slug)).limit(1);
		return plan;
	},
	async createTransaction(data: typeof transaction.$inferInsert) {
		const [created] = await database.insert(transaction).values(data).returning();
		return created;
	},
});

export const subscriptionRepository = createSubscriptionRepository(db);
