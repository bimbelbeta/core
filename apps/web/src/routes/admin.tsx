import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin/sidebar";
import { $getSession } from "@/lib/get-user";
import { createMeta } from "@/lib/seo-utils";

export const Route = createFileRoute("/admin")({
	head: () => ({
		meta: createMeta({
			title: "Admin",
			description: "Panel admin untuk mengelola konten bimbelbeta.",
			noIndex: true,
		}),
	}),
	beforeLoad: async ({ context, preload }) => {
		if (preload) return;
		const { session } = await $getSession(context.queryClient);

		return { session };
	},
	loader: ({ location, context }) => {
		if (!context.session)
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		if (context.session.user.role !== "admin")
			throw redirect({
				to: "/dashboard",
				search: {
					redirect: location.href,
				},
			});
	},
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<div className="flex min-h-screen">
			<AdminSidebar />
			<main className="flex-1 bg-background p-4 pt-20 lg:p-8 lg:pt-8">
				<Outlet />
			</main>
		</div>
	);
}
