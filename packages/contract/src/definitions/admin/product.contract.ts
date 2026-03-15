import { product } from "@bimbelbeta/db/schema/transaction";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { PageInfoSchema, PaginationInputSchema } from "../../common/pagination";
import { oc } from "../../lib/contract-definition";

const ProductSchema = createSelectSchema(product);

const ProductListInputSchema = type({
	"...": PaginationInputSchema,
	search: "string?",
	variant: "'fixed_date' | 'monthly' | 'credits'?",
	includeDeleted: "boolean?",
});

const ProductListOutputSchema = type({
	items: ProductSchema.array(),
	pageInfo: PageInfoSchema,
});

const ProductDetailOutputSchema = type({
	product: ProductSchema,
});

const MessageResponseSchema = type({
	message: "string",
});

const ProductCreateOutputSchema = type({
	message: "string",
	id: "string",
});

export const adminProductContract = {
	list: oc
		.route({
			path: "/admin/products",
			method: "GET",
			tags: ["Admin - Products"],
		})
		.input(ProductListInputSchema)
		.output(ProductListOutputSchema),
	find: oc
		.route({
			path: "/admin/products/{productId}",
			method: "GET",
			tags: ["Admin - Products"],
		})
		.input(type({ productId: "string" }))
		.output(ProductDetailOutputSchema),
	create: oc
		.route({
			path: "/admin/products",
			method: "POST",
			tags: ["Admin - Products"],
		})
		.input(
			type({
				name: "string",
				slug: "string | null?",
				description: "string | null?",
				price: "string",
				type: "'product' | 'subscription'",
				variant: "'fixed_date' | 'monthly' | 'credits'",
				fixedExpiryMonth: "number | null?",
				fixedExpiryDay: "number | null?",
				durationDays: "number | null?",
				credits: "number | null?",
			}),
		)
		.output(ProductCreateOutputSchema),
	update: oc
		.route({
			path: "/admin/products/{productId}",
			method: "PATCH",
			tags: ["Admin - Products"],
		})
		.input(
			type({
				productId: "string",
				name: "string?",
				slug: "string | null?",
				description: "string | null?",
				price: "string?",
				type: "'product' | 'subscription'?",
				variant: "'fixed_date' | 'monthly' | 'credits'?",
				fixedExpiryMonth: "number | null?",
				fixedExpiryDay: "number | null?",
				durationDays: "number | null?",
				credits: "number | null?",
			}),
		)
		.output(MessageResponseSchema),
	remove: oc
		.route({
			path: "/admin/products/{productId}",
			method: "DELETE",
			tags: ["Admin - Products"],
		})
		.input(type({ productId: "string" }))
		.output(MessageResponseSchema),
	restore: oc
		.route({
			path: "/admin/products/{productId}/restore",
			method: "POST",
			tags: ["Admin - Products"],
		})
		.input(type({ productId: "string" }))
		.output(MessageResponseSchema),
};
