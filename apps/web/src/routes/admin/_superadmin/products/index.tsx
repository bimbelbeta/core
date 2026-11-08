import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { productVariantSchema } from "@/lib/schemas";
import { ProductsListPage } from "./-components/products-list-page";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"variant?": productVariantSchema,
	"includeDeleted?": "boolean",
});

export const Route = createFileRoute("/admin/_superadmin/products/")({
	staticData: { breadcrumb: "Produk" },
	component: ProductsListPage,
	validateSearch: searchSchema,
});
