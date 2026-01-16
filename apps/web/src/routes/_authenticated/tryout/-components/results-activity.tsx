import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ResultsActivity() {
	const mockResults = [
		{ id: 1, title: "Tryout UTBK 1", totalScore: 750, score: 750 },
		{ id: 2, title: "Tryout UTBK 2", totalScore: 820, score: 820 },
		{ id: 3, title: "Tryout UTBK 3", totalScore: 680, score: 680 },
	];

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{mockResults.map((result) => (
				<ResultCard key={result.id} title={result.title} score={result.score} />
			))}
		</div>
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
