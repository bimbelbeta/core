import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { product } from "../schema/transaction";

export async function clearProducts(db: NodePgDatabase) {
	console.log("Clearing products...");
	await db.delete(product);
}

export async function seedProducts(db: NodePgDatabase) {
	console.log("Seeding products...");

	await db.insert(product).values([
		// Premium subscription
		{
			name: "Premium",
			slug: "premium",
			price: "300000",
			type: "subscription",
			credits: null,
		},
		// Tryout credit packages
		{
			name: "1x Tryout",
			slug: "tryout-1",
			price: "30000",
			type: "product",
			credits: 1,
		},
		{
			name: "10x Tryout",
			slug: "tryout-10",
			price: "100000",
			type: "product",
			credits: 10,
		},
	]);

	console.log("Products seeded successfully");
}
