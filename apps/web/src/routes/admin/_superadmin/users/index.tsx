import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { RoleSchema } from "@bimbelbeta/contract/common/roles";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { UsersListPage } from "./-components/users-list-page";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"role?": RoleSchema,
	"isPremium?": "boolean",
});

export const Route = createFileRoute("/admin/_superadmin/users/")({
	staticData: { breadcrumb: "Pengguna" },
	component: UsersListPage,
	validateSearch: searchSchema,
});
