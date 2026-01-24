import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { product } from "@bimbelbeta/db/schema/transaction";
import { eq } from "drizzle-orm";
import { authed } from "../index";

const balance = authed
	.route({
		path: "/credits/balance",
		method: "GET",
		tags: ["Credits"],
	})
	.handler(async ({ context }) => {
		const [userData] = await db
			.select({ tryoutCredits: user.tryoutCredits })
			.from(user)
			.where(eq(user.id, context.session.user.id))
			.limit(1);

		return {
			balance: userData?.tryoutCredits ?? 0,
		};
	});

const packages = authed
	.route({
		path: "/credits/packages",
		method: "GET",
		tags: ["Credits"],
	})
	.handler(async () => {
		const creditPackages = await db
			.select({
				id: product.id,
				name: product.name,
				slug: product.slug,
				price: product.price,
				credits: product.credits,
			})
			.from(product)
			.where(eq(product.type, "product"));

		return creditPackages.filter((pkg) => pkg.credits !== null);
	});

export const creditRouter = {
	balance,
	packages,
};
