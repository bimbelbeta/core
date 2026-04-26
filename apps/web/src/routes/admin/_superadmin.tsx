import { ROLES } from "@bimbelbeta/contract/common/roles";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { $getSession } from "@/lib/get-user";

export const Route = createFileRoute("/admin/_superadmin")({
	staticData: { breadcrumb: "Superadmin" },
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
		if (context.session.user.role !== ROLES.SUPER_ADMIN)
			throw redirect({
				to: "/admin/dashboard",
			});
	},
	component: SuperadminLayout,
});

function SuperadminLayout() {
	return <Outlet />;
}
