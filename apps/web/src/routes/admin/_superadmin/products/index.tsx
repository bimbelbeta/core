import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { ProductsListPage } from "./-components/products-list-page";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"variant?": "'fixed_date' | 'monthly' | 'credits'",
	"includeDeleted?": "boolean",
});

export const Route = createFileRoute("/admin/_superadmin/products/")({
	staticData: { breadcrumb: "Products" },
	component: ProductsListPage,
	validateSearch: searchSchema,
});
