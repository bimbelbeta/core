import { CoinsIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { type } from "arktype";
import ErrorComponent from "@/components/shared/error";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { TargetSelectionDialog } from "@/routes/_authenticated/-components/target-selection-dialog";
import { GuidelineActivity } from "./-components/guideline-activity";
import { PassingGradeActivity } from "./-components/passing-grade-activity";
import { ResultsActivity } from "./-components/results-activity";

const levelSchema = type({
	"level?": '"tka" | "utbk"',
});

export const Route = createFileRoute("/_authenticated/tryout/")({
	component: RouteComponent,
	validateSearch: (search) => levelSchema.assert(search),
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

function TryoutHeader({ creditBalance, level }: { creditBalance: number; level: TryoutLevel }) {
	const currentLevel = TRYOUT_LEVELS[level];

	return (
		<div className="rounded-default from-primary-700 to-secondary-800 relative overflow-hidden bg-linear-to-r">
			<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-3 sm:items-center sm:px-10 sm:py-10">
				<div className="relative order-last -mx-6 h-27.5 overflow-hidden sm:order-first sm:mr-0 sm:-ml-10 sm:h-auto sm:overflow-visible">
					<Image
						src="/stock/tryout.webp"
						alt="Tryout Header Avatar"
						width={260}
						height={260}
						className="absolute left-0 size-52.5 -translate-y-10 object-cover select-none sm:bottom-0 sm:translate-y-1/2"
					/>
				</div>

				<div className="z-10 max-w-xl space-y-1 sm:col-span-2">
					<Typography variant="subtitle1" as="h1" className="font-bold text-white">
						{currentLevel.title}
					</Typography>
					<Typography variant="subtitle3" className="leading-5 text-white">
						{currentLevel.description}
					</Typography>

					{creditBalance > 0 ? (
						<div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2">
							<CoinsIcon size={20} weight="fill" className="text-yellow-300" />
							<span className="text-sm font-medium text-white">
								Kredit Tryout: <strong>{creditBalance}</strong>
							</span>
						</div>
					) : (
						<Link
							to="/premium"
							className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 transition-colors hover:bg-black/35"
						>
							<CoinsIcon size={20} className="text-white" />
							<span className="text-sm text-white">Beli Kredit Tryout</span>
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const { level } = Route.useSearch();
	const navigate = useNavigate();
	const activeLevel = level ?? "utbk";

	const setLevel = (nextLevel: TryoutLevel) => {
		navigate({
			to: "/tryout",
			search: { level: nextLevel },
		});
	};

	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	if (creditBalanceQuery.isError) {
		return <ErrorComponent error={creditBalanceQuery.error} />;
	}

	return (
		<>
			<TargetSelectionDialog />
			<TryoutHeader creditBalance={creditBalance} level={activeLevel} />
			<Tabs value={activeLevel} onValueChange={(value) => setLevel(value as TryoutLevel)}>
				<TabsList>
					{Object.entries(TRYOUT_LEVELS).map(([levelKey, config]) => (
						<TabsTrigger key={levelKey} value={levelKey}>
							{config.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			<div className="flex flex-col gap-12">
				<GuidelineActivity level={activeLevel} />

				<section className="space-y-4">
					<Typography variant="subtitle2">Hasil TryOut</Typography>
					<ResultsActivity />
				</section>

				{activeLevel === "utbk" && (
					<section className="space-y-4">
						<div className="space-y-1">
							<Typography variant="subtitle2">Passing Grade</Typography>
							<Typography tone="muted">Referensi skor terakhir untuk universitas dan prodi tujuanmu.</Typography>
						</div>
						<PassingGradeActivity />
					</section>
				)}
			</div>
		</>
	);
}
