import { createFileRoute } from "@tanstack/react-router";
import { createMeta } from "@/lib/seo-utils";
import { LastClasses } from "../-components/last-classes";
import { DashboardMainCard } from "./-components/dashboard-main-card";

export const Route = createFileRoute("/_authenticated/dashboard/")({
	head: () => ({
		meta: createMeta({
			title: "Dashboard",
			description: "Dashboard belajar bimbelbeta untuk persiapan SNBT/UTBK.",
			noIndex: true,
		}),
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const firstName = session?.user.name.split(" ")[0] || "User";

	return (
		<div className="flex flex-col gap-8">
			<section className="flex items-center gap-2">
				<div className="text-5xl">🔥</div>
				<div className="space-y-1">
					<h1 className="font-semibold text-3xl text-tertiary-1000 leading-tight sm:text-4xl">Halo, {firstName}!</h1>
					<p className="text-sm sm:text-base">Kembali belajar bersama bimbel-beta</p>
				</div>
			</section>

			<section className="grid gap-6 md:grid-cols-2">
				<DashboardMainCard
					title="Lihat semua kelas!"
					description="Gabung kelas untuk dapat mengikuti pelajaran"
					to="/classes"
				/>
				<DashboardMainCard
					title="Tryout UTBK"
					description="Yuk belajar bersama untuk sukses dalam UTBK!"
					href="https://www.anycademy.com"
				/>
			</section>

			<LastClasses />
		</div>
	);
}
