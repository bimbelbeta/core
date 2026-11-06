import { createFileRoute, Outlet, redirect, useLocation, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { HeaderDashboard } from "@/components/shared/header-dashboard";
import { Container } from "@/components/ui/container";
import { $getSession, SessionLookupError } from "@/lib/get-user";
import { createMeta } from "@/lib/seo-utils";
import type { RouterAppContext } from "@/routes/__root";

const SESSION_RETRY_DELAYS_MS = [300, 700] as const;

async function getSessionWithRetry(queryClient: RouterAppContext["queryClient"]) {
	for (let attempt = 0; attempt <= SESSION_RETRY_DELAYS_MS.length; attempt++) {
		try {
			return await $getSession(queryClient);
		} catch (error) {
			const delay = SESSION_RETRY_DELAYS_MS[attempt];

			if (!(error instanceof SessionLookupError) || !error.retryable || delay === undefined) {
				throw error;
			}

			await new Promise<void>((resolve) => {
				setTimeout(resolve, delay);
			});
		}
	}

	throw new Error("Session verification failed.");
}

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

		const { session } = await getSessionWithRetry(context.queryClient);

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

	return (
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
	);
}
