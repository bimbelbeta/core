import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/dashboard")({
	component: AdminDashboard,
});

function AdminDashboard() {
	return (
		<main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-8">
			<div className="mb-6 sm:mb-8">
				<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">Admin Dashboard</h1>
				<p className="text-muted-foreground text-sm sm:text-base">Selamat datang di panel admin bimbelbeta</p>
			</div>
		</main>
	);
}
