import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { ReferralListPage } from "./-components/referral-list-page";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
});

export const Route = createFileRoute("/admin/_superadmin/referrals/")({
	staticData: { breadcrumb: "Referral Codes" },
	component: ReferralListPage,
	validateSearch: searchSchema,
});
