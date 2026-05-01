import { db } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { desc } from "drizzle-orm";
import { baseImplementer } from "@/lib/router-definition";
import { rateLimit, requireAuth } from "@/lib/router-definition/middleware";

const authed = baseImplementer.use(requireAuth).use(rateLimit);

const list = authed.product.list.handler(async () => {
	return db
		.select({
			id: product.id,
			name: product.name,
			slug: product.slug,
			description: product.description,
			price: product.price,
			type: product.type,
			variant: product.variant,
			fixedExpiryMonth: product.fixedExpiryMonth,
			fixedExpiryDay: product.fixedExpiryDay,
			durationDays: product.durationDays,
			credits: product.credits,
		})
		.from(product)
		.orderBy(desc(product.createdAt))
		.limit(100);
});

export const productRouter = {
	list,
};
