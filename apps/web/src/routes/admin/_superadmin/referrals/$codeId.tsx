import { createFileRoute } from "@tanstack/react-router";
import { ReferralDetailPage } from "./-components/referral-detail-page";

export const Route = createFileRoute("/admin/_superadmin/referrals/$codeId")({
	staticData: { breadcrumb: "Detail Referral", breadcrumbParent: { label: "Referral Codes", to: "/admin/referrals" } },
	component: ReferralDetailPage,
});
