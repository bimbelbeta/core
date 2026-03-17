import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { product } from "@bimbelbeta/db/schema/transaction";
import { and, eq, isNotNull } from "drizzle-orm";
import { baseImplementer } from "../lib/router-definition";
import { rateLimit, requireAuth } from "../lib/router-definition/middleware";

const authed = baseImplementer.use(requireAuth).use(rateLimit);

const balance = authed.credit.balance.handler(async ({ context }) => {
	const [userData] = await db
		.select({ tryoutCredits: user.tryoutCredits })
		.from(user)
		.where(eq(user.id, context.session.user.id))
		.limit(1);

	return {
		balance: userData?.tryoutCredits ?? 0,
	};
});

const packages = authed.credit.packages.handler(async () => {
	return db
		.select({
			id: product.id,
			name: product.name,
			slug: product.slug,
			price: product.price,
			credits: product.credits,
		})
		.from(product)
		.where(and(eq(product.type, "product"), isNotNull(product.credits)));
});

export const creditRouter = {
	balance,
	packages,
};
