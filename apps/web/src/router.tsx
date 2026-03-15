import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { configure } from "arktype/config";
import Loader from "./components/shared/loader";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";

configure({
	keywords: {
		"string.email": {
			description: "alamat email yang valid",
		},
	},
});

import ErrorComponent from "./components/shared/error";
import NotFound from "./components/shared/not-found";
import { routeTree } from "./routeTree.gen";
import { orpc, queryClient } from "./utils/orpc";

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { orpc, queryClient, session: null },
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: () => <NotFound />,
		defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
		Wrap: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
	});
	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
