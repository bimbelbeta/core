import { product } from "@bimbelbeta/db/schema/transaction";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-orm/arktype";
import { PageInfoSchema } from "@/common/pagination";
import { oc } from "@/lib/contract-definition";

const ProductSchema = createSelectSchema(product).omit("createdAt", "updatedAt", "deletedAt");

export const listProductsContract = oc
	.route({
		path: "/products",
		method: "GET",
		tags: ["Products"],
	})
	.input(
		type({
			"limit?": "number >= 1",
			"after?": "string",
			"before?": "string",
		}),
	)
	.output(
		type({
			items: ProductSchema.array(),
			pageInfo: PageInfoSchema,
		}),
	);

export const productContract = {
	list: listProductsContract,
};
