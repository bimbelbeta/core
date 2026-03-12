import { listProductsOutput, listProductsRoute } from "@bimbelbeta/contract";
import { db } from "@bimbelbeta/db";
import { product } from "@bimbelbeta/db/schema/transaction";
import { desc } from "drizzle-orm";
import { authed } from "../index";

const list = authed
	.route(listProductsRoute)
	.output(listProductsOutput)
	.handler(async () => {
		const products = await db
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
			.orderBy(desc(product.createdAt));

		return products;
	});

export const productRouter = {
	list,
};
