import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect, useLocation, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { HeaderDashboard } from "@/components/header-dashboard";
import { Container } from "@/components/ui/container";
import { $getSession } from "@/lib/get-user";
import { createMeta } from "@/lib/seo-utils";
import { TargetSelectionDialog } from "@/routes/_authenticated/-components/target-selection-dialog";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated")({
	head: () => ({
		meta: createMeta({
			title: "Dashboard",
			description: "Dashboard persiapan SNBT/UTBK kamu.",
			noIndex: true,
		}),
	}),
	component: AuthedLayout,
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
	},
});

function AuthedLayout() {
	const location = useLocation();
	const routerState = useRouterState();
	const stablePathnameRef = useRef(location.pathname);

	// Only update pathname when route is fully loaded (not pending) to prevent layout shifting yg too soon
	const isPending = routerState.isLoading || routerState.isTransitioning;

	useEffect(() => {
		if (!isPending) {
			stablePathnameRef.current = location.pathname;
		}
	}, [location.pathname, isPending]);

	const pathname = isPending ? stablePathnameRef.current : location.pathname;

	// Check if user has target university and study program
	useQuery(orpc.userSettings.get.queryOptions());

	return (
		<>
			<TargetSelectionDialog />
			<main className="min-h-screen">
				<HeaderDashboard />

				{/^\/classes\/[^/]+\/[^/]+\/(video|notes|latihan-soal)/.test(pathname) ? (
					<Container className="flex flex-col gap-6 py-0">
						<Outlet />
					</Container>
				) : (
					<Container className={"flex flex-col gap-6 pt-30"}>
						<Outlet />
					</Container>
				)}
			</main>
		</>
	);
}
