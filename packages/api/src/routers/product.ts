import { db } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { desc } from "drizzle-orm";
import { pub } from "../index";

const list = pub
	.route({
		path: "/products",
		method: "GET",
		tags: ["Products"],
	})
	.handler(async () => {
		const products = await db
			.select({
				id: product.id,
				name: product.name,
				slug: product.slug,
				description: product.description,
				price: product.price,
				variant: product.variant,
				fixedExpiryMonth: product.fixedExpiryMonth,
				fixedExpiryDay: product.fixedExpiryDay,
				durationDays: product.durationDays,
				credits: product.credits,
			})
			.from(product)
			.orderBy(desc(product.createdAt));

		return products;
	});

export const productRouter = {
	list,
};
