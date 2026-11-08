import { createFileRoute } from "@tanstack/react-router";
import { ReferralDetailPage } from "./-components/referral-detail-page";

export const Route = createFileRoute("/admin/_superadmin/referrals/$codeId")({
	staticData: { breadcrumb: "Detail referral", breadcrumbParent: { label: "Kode referral", to: "/admin/referrals" } },
	component: ReferralDetailPage,
});
