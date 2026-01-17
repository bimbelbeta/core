import { ArrowRightIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

export function ResultsActivity() {
	const attempts = useQuery(orpc.tryout.history.queryOptions());

	return (
		<div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-3">
			{attempts.isPending ? (
				<>
					<ResultsActivitySkeleton />
					<ResultsActivitySkeleton />
					<ResultsActivitySkeleton />
				</>
			) : attempts.data?.length === 0 || attempts.isError ? (
				<div className="col-span-full flex flex-col items-center justify-center space-y-3 py-8 text-center">
					<WarningCircleIcon size={80} />
					<p className="text-xl">Kamu belum mengikuti tryout apapun</p>
					<Button asChild>
						<Link to="/tryout">
							Mulai Tryout <ArrowRightIcon className="" />
						</Link>
					</Button>
				</div>
			) : (
				attempts.data?.map((result) => (
					<ResultCard key={result.id} title={result.tryout.title} score={result.score ?? 0} />
				))
			)}
		</div>
	);
}

function ResultsActivitySkeleton() {
	return (
		<Card className="flex flex-col gap-2 p-4">
			<Skeleton className="h-6 w-3/4" />
			<Separator className="my-0" />
			<Skeleton className="h-6 w-20 translate-y-1" />
			<div className="mt-auto flex items-center justify-between">
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-8 w-24" />
			</div>
		</Card>
	);
}

type ResultCardProps = {
	title: string;
	score: number;
};

function ResultCard({ title, score }: ResultCardProps) {
	return (
		<Card className="flex flex-col gap-2 p-4">
			<h3 className="text-base">{title}</h3>
			<Separator className="my-0" />
			<div className="translate-y-1 text-base text-muted-foreground">Total Score</div>
			<div className="mt-auto flex items-center justify-between">
				<span className="text-3xl">
					{score} <span className="text-base">/ 1000</span>
				</span>
				<Button size="sm">Lihat Hasil</Button>
			</div>
		</Card>
	);
}
