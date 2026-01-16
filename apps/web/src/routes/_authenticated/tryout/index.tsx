import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

function RouteComponent() {
	const [activeTab, setActiveTab] = useState<"guideline" | "passing_grade" | "results">("guideline");

	return (
		<>
			<section className="flex items-center gap-2">
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
				{activeTab === "guideline" && <GuidelineActivity />}
				{activeTab === "passing_grade" && <PassingGradeActivity />}
				{activeTab === "results" && <ResultsActivity />}
			</section>
		</>
	);
}
