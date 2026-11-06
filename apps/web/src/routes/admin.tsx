import { ROLES } from "@bimbelbeta/contract/common/roles";
import { ArrowSquareInIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { $getSession } from "@/lib/get-user";
import { createMeta } from "@/lib/seo-utils";

export const Route = createFileRoute("/admin")({
	staticData: { breadcrumb: "Admin" },
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
		<SidebarProvider className="admin-shell [--sidebar-width:13.5rem]!">
			<AppSidebar />
			<SidebarInset className="bg-muted min-w-0">
				<header className="bg-card/85 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-md sm:px-6 lg:px-8">
					<SidebarTrigger
						title="Buka/tutup navigasi"
						className="text-muted-foreground hover:bg-muted hover:text-foreground size-8 rounded-md"
					/>
					<AdminBreadcrumb />
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="text-muted-foreground hover:bg-muted hover:text-foreground ml-auto h-8 gap-1.5 px-2.5 text-[13px]"
					>
						<Link to="/dashboard" aria-label="Buka dashboard pengguna">
							<ArrowSquareInIcon className="size-4" />
							<span className="hidden sm:inline">Buka dashboard pengguna</span>
							<span className="sm:hidden">Situs</span>
						</Link>
					</Button>
				</header>
				<main className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col overflow-y-auto">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
