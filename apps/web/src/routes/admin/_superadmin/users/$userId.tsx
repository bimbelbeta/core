import { createFileRoute } from "@tanstack/react-router";
import { UserDetailPage } from "./-components/user-detail-page";

export const Route = createFileRoute("/admin/_superadmin/users/$userId")({
	staticData: { breadcrumb: "Detail User", breadcrumbParent: { label: "Users", to: "/admin/users" } },
	component: UserDetailPage,
});
