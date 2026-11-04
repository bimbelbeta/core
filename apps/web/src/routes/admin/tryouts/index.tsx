import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { subjectCategorySchema, tryoutStatusSchema } from "@/lib/schemas";
import { TryoutsListPage } from "./-components/tryouts-list-page";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"category?": subjectCategorySchema,
	"status?": tryoutStatusSchema,
});

export const Route = createFileRoute("/admin/tryouts/")({
	staticData: { breadcrumb: "Tryout" },
	component: TryoutsListPage,
	validateSearch: searchSchema,
});
