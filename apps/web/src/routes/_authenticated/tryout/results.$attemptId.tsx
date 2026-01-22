import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import ErrorComponent from "@/components/error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/tryout/results/$attemptId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { attemptId } = Route.useParams();
	const { data, isPending, error } = useQuery(
		orpc.tryout.attemptResult.queryOptions({
			input: { attemptId: Number(attemptId) },
		}),
	);

	if (isPending) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/tryout" search={{ tab: "results" }}>
							<ArrowLeftIcon />
							Kembali
						</Link>
					</Button>
				</div>
				<Skeleton className="h-12 w-64" />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Skeleton className="h-32" />
					<Skeleton className="h-32" />
					<Skeleton className="h-32" />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return <ErrorComponent error={error} />;
	}

	const completedSubtestIds = new Set(
		data.subtestAttempts.filter((sa) => sa.status === "finished").map((sa) => sa.subtestId),
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/tryout" search={{ tab: "results" }}>
						<ArrowLeftIcon />
						Kembali
					</Link>
				</Button>
			</div>

			<div className="space-y-1">
				<h1 className="font-bold text-2xl">{data.tryout.title}</h1>
				<p className="text-muted-foreground">Hasil Tryout</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Total Skor</CardTitle>
				</CardHeader>
				<CardContent>
					<span className="font-bold text-4xl">{data.score ?? 0}</span>
					<span className="text-muted-foreground"> / 1000</span>
				</CardContent>
			</Card>

			<Separator />

			<h2 className="font-semibold text-lg">Status per Subtest</h2>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{data.tryout.subtests.map((subtest) => (
					<Card key={subtest.id}>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">{subtest.name}</CardTitle>
						</CardHeader>
						<CardContent>
							<span className={completedSubtestIds.has(subtest.id) ? "text-green-600" : "text-muted-foreground"}>
								{completedSubtestIds.has(subtest.id) ? "Selesai" : "Belum dikerjakan"}
							</span>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
