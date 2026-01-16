import { isDefinedError } from "@orpc/client";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/dashboard/flashcard/result")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { data, isPending } = useQuery(orpc.flashcard.result.queryOptions({ input: {} }));

	const startMutation = useMutation(
		orpc.flashcard.start.mutationOptions({
			onSuccess: () => {
				queryClient.resetQueries({ queryKey: orpc.flashcard.get.key() });
				navigate({ to: "/dashboard/flashcard" });
			},
			onError: (error) => {
				if (isDefinedError(error) && error.code === "NOT_FOUND") {
					toast.error("Ups! Kamu sudah mengerjakan semua Brain Gym yang tersedia!", {
						description: "Silahkan coba lagi dalam beberapa saat.",
					});
				} else if (isDefinedError(error) && error.code === "UNPROCESSABLE_CONTENT") {
					toast.error(error.message);
				}
			},
		}),
	);

	return (
		<section className="flex flex-col gap-4 border bg-white p-4">
			<div className="flex gap-2">
				<Button className="w-fit" asChild>
					<Link to="/dashboard">
						<ArrowLeftIcon /> Kembali
					</Link>
				</Button>
				<Button className="w-fit" onClick={() => startMutation.mutate({})} disabled={startMutation.isPending}>
					{startMutation.isPending ? "Memulai..." : "Main Lagi"}
				</Button>
			</div>

			<div className="relative flex items-end overflow-clip bg-green-700 p-4">
				<div className="pointer-events-none absolute top-1/2 -right-30 z-0 size-60 -translate-y-1/2 rounded-full bg-green-500" />
				<h1 className="relative z-10 my-auto font-normal text-white text-xl">Brain Gym</h1>
			</div>

			<div className="flex gap-2 max-sm:flex-col [&>div]:min-w-46">
				<div className="flex flex-col gap-2 rounded-md border p-4">
					<p>Hasil</p>
					<p>
						{isPending ? (
							<Skeleton className="h-10 w-16" />
						) : (
							<>
								<span className="mr-1 font-bold text-4xl text-primary">
									{((data?.correctAnswersCount || 0) / (data?.questionsCount || 5)) * 100}
								</span>
								/100
							</>
						)}
					</p>
				</div>

				<div className="flex flex-col gap-2 rounded-md border p-4">
					<p>Benar</p>
					<p>
						{isPending ? (
							<Skeleton className="h-10 w-16" />
						) : (
							<>
								<span className="mr-1 font-bold text-4xl text-primary">{data?.correctAnswersCount}</span>/
								{data?.questionsCount}
							</>
						)}
					</p>
				</div>
			</div>

			<h2 className="font-medium">Jawaban</h2>
			<div className="flex flex-col gap-4">
				{isPending ? (
					<Skeleton className="h-120 w-full" />
				) : (
					data?.assignedQuestions.map((assignedQuestion) => {
						const correctAnswer = assignedQuestion.question.answerOptions.find((answer) => answer.isCorrect);
						const userAnswer = assignedQuestion.question.answerOptions.find(
							(answer) => answer.id === assignedQuestion.selectedAnswerId,
						);
						const isCorrect = correctAnswer?.id === userAnswer?.id;

						return (
							<div key={assignedQuestion.selectedAnswerId}>
								<div
									className={`flex items-center gap-4 rounded-sm p-4 text-sm ${isCorrect ? "bg-green-200 text-green-500" : "bg-red-200 text-red-500"}`}
								>
									<span className={"rounded-xs border border-accent bg-white px-2.5 py-0.5 font-semibold"}>
										{userAnswer?.code || "-"}
									</span>
									<span className={isCorrect ? "text-green-900" : ""}>
										{userAnswer ? <TiptapRenderer content={userAnswer.content} /> : "Tidak menjawab"}
									</span>
								</div>
								<div className="mx-4 rounded-b-sm border bg-white px-4 py-2 text-xs">
									<TiptapRenderer content={assignedQuestion.question.discussion} />
								</div>
							</div>
						);
					})
				)}
			</div>
		</section>
	);
}
