import { CoinsIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { type } from "arktype";
import { Activity } from "react";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { GuidelineActivity } from "./-components/guideline-activity";
import { PassingGradeActivity } from "./-components/passing-grade-activity";
import { ResultsActivity } from "./-components/results-activity";

const tabSchema = type({
	"tab?": '"guideline" | "passing_grade" | "results"',
});

export const Route = createFileRoute("/_authenticated/tryout/")({
	component: RouteComponent,
	validateSearch: (search) => tabSchema.assert(search),
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

function TryoutHeader({ creditBalance }: { creditBalance: number }) {
	return (
		<div className="relative overflow-hidden rounded-default bg-linear-to-r from-primary-500 to-secondary-400">
			<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-3 sm:items-center sm:px-10 sm:py-10">
				<div className="relative order-last -mx-6 h-27.5 overflow-hidden sm:order-first sm:mx-0 sm:h-auto sm:overflow-visible">
					<Image
						src="/stock/tryout.webp"
						alt="Tryout Header Avatar"
						width={260}
						height={260}
						className="absolute left-0 size-52.5 -translate-y-10 select-none object-cover sm:bottom-0 sm:translate-y-1/2"
					/>
				</div>

				<div className="z-10 max-w-xl space-y-1 sm:col-span-2">
					<h1 className="font-bold text-2xl text-white leading-tight">Tryout UTBK</h1>
					<p className="text-black leading-5">Uji kemampuanmu dengan simulasi tryout yang mirip dengan UTBK asli!</p>

					{/* Credit balance display */}
					{creditBalance > 0 ? (
						<div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
							<CoinsIcon size={20} weight="fill" className="text-yellow-300" />
							<span className="font-medium text-sm text-white">
								Kredit Tryout: <strong>{creditBalance}</strong>
							</span>
						</div>
					) : (
						<Link
							to="/premium"
							className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 transition-colors hover:bg-white/30"
						>
							<Coins size={20} className="text-white/70" />
							<span className="text-sm text-white/90">Beli Kredit Tryout</span>
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const { tab } = Route.useSearch();
	const navigate = useNavigate();
	const activeTab = tab ?? "guideline";

	// Fetch credit balance
	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	const setActiveTab = (newTab: "guideline" | "passing_grade" | "results") => {
		navigate({ to: "/tryout", search: { tab: newTab } });
	};

	return (
		<>
			<TryoutHeader creditBalance={creditBalance} />
			<section className="mt-4 flex items-center gap-2">
				{TABS.map((t) => (
					<Button
						key={t.slug}
						variant={activeTab === t.slug ? "default" : "outline"}
						onClick={() => setActiveTab(t.slug)}
					>
						{t.name}
					</Button>
				))}
			</section>
			<section className="min-h-[50vh]">
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
