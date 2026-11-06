import { createFileRoute } from "@tanstack/react-router";
import { UserDetailPage } from "./-components/user-detail-page";

export const Route = createFileRoute("/admin/_superadmin/users/$userId")({
	staticData: { breadcrumb: "Detail pengguna", breadcrumbParent: { label: "Pengguna", to: "/admin/users" } },
	component: UserDetailPage,
});
