import { oc } from "@orpc/contract";
import { type } from "arktype";

const ProductSchema = type({
	id: "string",
	name: "string",
	slug: "string",
	description: "string | null",
	price: "string",
	type: "'subscription' | 'product'",
	variant: "'fixed_date' | 'monthly' | 'credits'",
	fixedExpiryMonth: "number | null",
	fixedExpiryDay: "number | null",
	durationDays: "number | null",
	credits: "number | null",
});

export const listProductsOutput = ProductSchema.array();

export const listProductsRoute = {
	path: "/products",
	method: "GET",
	tags: ["Products"],
} as const;

export const listProductsContract = oc.route(listProductsRoute).output(listProductsOutput);

export const productContract = {
	list: listProductsContract,
};
