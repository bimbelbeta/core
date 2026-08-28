import { CoinsIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { type } from "arktype";
import { Activity, useEffect } from "react";
import ErrorComponent from "@/components/shared/error";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";
import { TargetSelectionDialog } from "@/routes/_authenticated/-components/target-selection-dialog";
import { GuidelineActivity } from "./-components/guideline-activity";
import { PassingGradeActivity } from "./-components/passing-grade-activity";
import { ResultsActivity } from "./-components/results-activity";

const tabSchema = type({
	"level?": '"tka" | "utbk"',
	"tab?": '"guideline" | "passing_grade" | "results"',
});

export const Route = createFileRoute("/_authenticated/tryout/")({
	component: RouteComponent,
	validateSearch: (search) => tabSchema.assert(search),
});

const TRYOUT_LEVELS = {
	tka: {
		label: "TKA",
		title: "Tryout TKA",
		description: "Uji kemampuanmu dengan simulasi tryout TKA yang disesuaikan untuk jenjangmu!",
		tabs: [
			{ name: "Guideline", slug: "guideline" },
			{ name: "Hasil TryOut", slug: "results" },
		],
		defaultTab: "guideline",
	},
	utbk: {
		label: "UTBK",
		title: "Tryout UTBK",
		description: "Uji kemampuanmu dengan simulasi tryout yang mirip dengan UTBK asli!",
		tabs: [
			{ name: "Guideline", slug: "guideline" },
			{ name: "Passing Grade", slug: "passing_grade" },
			{ name: "Hasil TryOut", slug: "results" },
		],
		defaultTab: "guideline",
	},
} as const;

type TryoutLevel = keyof typeof TRYOUT_LEVELS;
type TryoutTab = "guideline" | "passing_grade" | "results";

function TryoutHeader({ creditBalance, level }: { creditBalance: number; level: TryoutLevel }) {
	const currentLevel = TRYOUT_LEVELS[level];

	return (
		<div className="relative overflow-hidden rounded-default bg-linear-to-r from-primary-500 to-secondary-400">
			<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-3 sm:items-center sm:px-10 sm:py-10">
				<div className="relative order-last -mx-6 h-27.5 overflow-hidden sm:order-first sm:mr-0 sm:-ml-10 sm:h-auto sm:overflow-visible">
					<Image
						src="/stock/tryout.webp"
						alt="Tryout Header Avatar"
						width={260}
						height={260}
						className="absolute left-0 size-52.5 -translate-y-10 select-none object-cover sm:bottom-0 sm:translate-y-1/2"
					/>
				</div>

				<div className="z-10 max-w-xl space-y-1 sm:col-span-2">
					<h1 className="font-bold text-2xl text-white leading-tight">{currentLevel.title}</h1>
					<p className="text-black leading-5">{currentLevel.description}</p>

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
							<CoinsIcon size={20} className="text-white/70" />
							<span className="text-sm text-white/90">Beli Kredit Tryout</span>
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const { level, tab } = Route.useSearch();
	const navigate = useNavigate();
	const activeLevel = level ?? "utbk";
	const currentLevel = TRYOUT_LEVELS[activeLevel];
	const activeTab = currentLevel.tabs.some((item) => item.slug === tab) ? tab : currentLevel.defaultTab;

	useEffect(() => {
		if (activeLevel === "tka" && tab === "passing_grade") {
			navigate({
				to: "/tryout",
				search: { level: activeLevel, tab: currentLevel.defaultTab },
				replace: true,
			});
		}
	}, [activeLevel, currentLevel.defaultTab, navigate, tab]);

	const setLevel = (nextLevel: TryoutLevel) => {
		navigate({
			to: "/tryout",
			search: { level: nextLevel, tab: TRYOUT_LEVELS[nextLevel].defaultTab },
		});
	};

	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	if (creditBalanceQuery.isError) {
		return <ErrorComponent error={creditBalanceQuery.error} />;
	}

	const setActiveTab = (newTab: TryoutTab) => {
		navigate({
			to: "/tryout",
			search: { level: activeLevel, tab: newTab },
		});
	};

	return (
		<>
			<TargetSelectionDialog />
			<section className="flex flex-wrap gap-2">
				{Object.entries(TRYOUT_LEVELS).map(([levelKey, config]) => (
					<Button
						key={levelKey}
						variant={activeLevel === levelKey ? "default" : "outline"}
						onClick={() => setLevel(levelKey as TryoutLevel)}
					>
						{config.label}
					</Button>
				))}
			</section>
			<TryoutHeader creditBalance={creditBalance} level={activeLevel} />
			<section className="mt-4 flex flex-wrap items-center gap-2">
				{currentLevel.tabs.map((t) => (
					<Button
						key={t.slug}
						variant={activeTab === t.slug ? "default" : "outline"}
						onClick={() => setActiveTab(t.slug as TryoutTab)}
					>
						{t.name}
					</Button>
				))}
			</section>
			<section className="min-h-[50vh]">
				<Activity mode={activeTab === "guideline" ? "visible" : "hidden"}>
					<GuidelineActivity level={activeLevel} />
				</Activity>
				{activeLevel === "utbk" && (
					<Activity mode={activeTab === "passing_grade" ? "visible" : "hidden"}>
						<PassingGradeActivity />
					</Activity>
				)}
				<Activity mode={activeTab === "results" ? "visible" : "hidden"}>
					<ResultsActivity />
				</Activity>
			</section>
		</>
	);
}
