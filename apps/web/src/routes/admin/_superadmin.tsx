import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { $getSession } from "@/lib/get-user";

export const Route = createFileRoute("/admin/_superadmin")({
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
    if (context.session.user.role !== "superadmin")
      throw redirect({
        to: "/admin/dashboard",
      });
  },
  component: SuperadminLayout,
});

function SuperadminLayout() {
  return <Outlet />;
}
