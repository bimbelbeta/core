import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { ReferralListPage } from "./-components/referral-list-page";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"status?": "'aktif' | 'nonaktif' | 'kedaluwarsa' | 'kuota_habis'",
});

export const Route = createFileRoute("/admin/_superadmin/referrals/")({
	staticData: { breadcrumb: "Kode referral" },
	component: ReferralListPage,
	validateSearch: searchSchema,
});
