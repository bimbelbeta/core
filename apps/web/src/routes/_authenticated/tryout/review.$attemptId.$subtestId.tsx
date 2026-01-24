import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import ErrorComponent from "@/components/error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

import { QuestionReviewItem } from "./-components/question-review-item";

export const Route = createFileRoute("/_authenticated/tryout/review/$attemptId/$subtestId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { attemptId, subtestId } = Route.useParams();
	const { data, isPending, error } = useQuery(
		orpc.tryout.review.queryOptions({
			input: {
				attemptId: Number(attemptId),
				subtestId: Number(subtestId),
			},
		}),
	);

	if (isPending) {
		return (
			<div className="flex flex-col gap-8 p-4 md:p-8">
				<div className="space-y-4">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-64" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return <ErrorComponent error={error} />;
	}

	return (
		<div className="flex flex-col gap-8 p-4 md:p-8">
			{/* Header */}
			<div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
				<Button variant="default" size="sm" className="bg-[#009CA6] hover:bg-[#008a93]" asChild>
					<Link to="/tryout/results/$attemptId" params={{ attemptId }} search={{ tab: "results" }}>
						<div className="flex items-center">
							<ArrowLeftIcon className="mr-2 size-4" />
							Kembali
						</div>
					</Link>
				</Button>

				<div className="space-y-1">
					<p className="font-semibold text-muted-foreground">Review Hasil Subtes</p>
					<h1 className="font-bold text-3xl">{data.subtest?.name}</h1>
				</div>
			</div>

			{/* Questions List */}
			<div className="space-y-4">
				{data.questions.map((question, index) => {
					const correctChoice = question.choices.find((c) => c.isCorrect);
					const isCorrect = question.userAnswer.selectedChoiceId === correctChoice?.id;

					return <QuestionReviewItem key={question.id} index={index} question={question} isCorrect={isCorrect} />;
				})}
			</div>
		</div>
	);
}
