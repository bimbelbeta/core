import { createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Activity, useState } from "react";
import { Button } from "@/components/ui/button";
import { GuidelineActivity } from "./-components/guideline-activity";
import { PassingGradeActivity } from "./-components/passing-grade-activity";
import { ResultsActivity } from "./-components/results-activity";

export const Route = createFileRoute("/_authenticated/tryout/")({
	component: RouteComponent,
});

const TABS = [
	{
		name: "Guideline",
		slug: "guideline",
	},
	{
		name: "Passing Grade",
		slug: "passing_grade",
	},
	{
		name: "Hasil TryOut",
		slug: "results",
	},
] as const;

function TryoutHeader() {
	return (
		<div className="relative overflow-hidden rounded-default bg-linear-to-r from-primary-500 to-secondary-400">
			<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-3 sm:items-center sm:px-10 sm:py-10">
				<div className="relative -mx-6 h-27.5 overflow-hidden sm:mx-0 sm:h-auto sm:overflow-visible">
					<Image
						src="/avatar/subtest-header-avatar.webp"
						alt="Tryout Header Avatar"
						width={260}
						height={260}
						className="absolute left-0 size-52.5 -translate-y-10 select-none object-cover sm:bottom-0 sm:translate-y-1/2"
					/>
				</div>

				<div className="z-10 max-w-xl space-y-1 sm:col-span-2">
					<h1 className="font-bold text-2xl text-white leading-tight">Tryout UTBK</h1>
					<p className="text-black leading-5">Uji kemampuanmu dengan simulasi tryout yang mirip dengan UTBK asli!</p>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const [activeTab, setActiveTab] = useState<"guideline" | "passing_grade" | "results">("guideline");

	return (
		<>
			<TryoutHeader />
			<section className="mt-4 flex items-center gap-2">
				{TABS.map((tab) => (
					<Button
						key={tab.slug}
						variant={activeTab === tab.slug ? "default" : "outline"}
						onClick={() => setActiveTab(tab.slug)}
					>
						{tab.name}
					</Button>
				))}
			</section>
			<section>
				<Activity mode={activeTab === "guideline" ? "visible" : "hidden"}>
					<GuidelineActivity />
				</Activity>
				<Activity mode={activeTab === "passing_grade" ? "visible" : "hidden"}>
					<PassingGradeActivity />
				</Activity>
				<Activity mode={activeTab === "results" ? "visible" : "hidden"}>
					<ResultsActivity />
				</Activity>
			</section>
		</>
	);
}
