import { product } from "@bimbelbeta/db/schema/transaction";
import { oc } from "@orpc/contract";
import { createSelectSchema } from "drizzle-arktype";

const ProductSchema = createSelectSchema(product).omit("createdAt", "updatedAt", "deletedAt");

export const listProductsContract = oc
	.route({
		path: "/products",
		method: "GET",
		tags: ["Products"],
	})
	.output(ProductSchema.array());

export const productContract = {
	list: listProductsContract,
};
