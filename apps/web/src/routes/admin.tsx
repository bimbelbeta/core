import { ROLES } from "@bimbelbeta/api/lib/roles";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
		if (context.session.user.role !== ROLES.ADMIN && context.session.user.role !== ROLES.SUPER_ADMIN)
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
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-sidebar px-4 shadow-xs transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
					<AdminBreadcrumb />
				</header>
				<main className="flex flex-1 flex-col gap-4">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
