import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/")({
	loader: () => {
		throw redirect({
			to: "/admin/dashboard",
			replace: true,
		});
	},
});
