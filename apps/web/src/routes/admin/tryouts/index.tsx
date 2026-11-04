import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { TryoutsListPage } from "./-components/tryouts-list-page";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
	"status?": "'draft' | 'published' | 'archived'",
});

export const Route = createFileRoute("/admin/tryouts/")({
	staticData: { breadcrumb: "Tryout" },
	component: TryoutsListPage,
	validateSearch: searchSchema,
});
