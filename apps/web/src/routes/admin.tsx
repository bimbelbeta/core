import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
					<h1 className="font-semibold text-lg">Admin Panel</h1>
				</header>
				<main className="flex flex-1 flex-col gap-4 p-4 pt-0">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
