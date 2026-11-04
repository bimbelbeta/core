import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import { PracticeQuestion } from "@/components/classes/practice-question";
import { PracticeQuestionHeader } from "@/components/classes/practice-question-header";
import { BackButton } from "@/components/shared/back-button";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";

export const Route = createFileRoute("/_authenticated/classes/$subjectId/$contentId/latihan-soal")({
	component: RouteComponent,
});

function RouteComponent() {
	const { subjectId: rawSubjectId, contentId: rawContentId } = Route.useParams();
	const subjectId = parseRouteParamToNumber(rawSubjectId);
	const contentId = parseRouteParamToNumber(rawContentId);
	const queryClient = useQueryClient();

	const content = useQuery(
		orpc.subject.findContent.queryOptions({
			input: { contentId },
		}),
	);

	const updateProgressMutation = useMutation(
		orpc.subject.updateProgress.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.subject.stats.key(),
				});
			},
		}),
	);

	const mutateRef = useRef(updateProgressMutation.mutate);
	mutateRef.current = updateProgressMutation.mutate;

	// Update progress when practice questions are viewed
	useEffect(() => {
		if (content.data?.practiceQuestions) {
			mutateRef.current({
				contentId,
				practiceQuestionsCompleted: true,
			});
		}
	}, [content.data?.practiceQuestions, contentId]);

	if (content.isPending) {
		return <Typography className="animate-pulse">Memuat latihan soal...</Typography>;
	}

	if (content.isError) {
		return <Typography className="text-red-500">Error: {content.error.message}</Typography>;
	}

	if (!content.data) return notFound();

	const practiceQuestions = content.data.practiceQuestions;
	if (!practiceQuestions) {
		return (
			<div className="space-y-4">
				<div className="flex justify-start">
					<BackButton to={`/classes/${subjectId}/${contentId}/video`} />
				</div>
				<Typography variant="subtitle2" as="p" className="text-primary-300">
					Latihan Soal
				</Typography>

				<PracticeQuestionHeader content={content.data.title} />

				<hr />

				<EmptyContentState />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Typography variant="subtitle2" as="p" className="text-primary-300">
				Latihan Soal
			</Typography>

			<Typography variant="title" as="h2">
				{content.data.title}
			</Typography>

			<hr />

			{Array.isArray(practiceQuestions?.questions) && practiceQuestions.questions.length > 0 ? (
				practiceQuestions.questions.map((q, idx) => (
					<PracticeQuestion
						key={q.questionId}
						questionNumber={idx + 1}
						totalQuestions={practiceQuestions.questions.length}
						answerTitle={q.type === "essay" ? "Kunci Jawaban" : "Jawaban"}
						question={<TiptapRenderer className="mt-4" content={q.question} />}
						answer={
							<div className="space-y-3">
								{q.answers && q.answers.length > 0 && (
									<div className="space-y-2">
										{q.answers.map((answer) => (
											<Typography
												key={answer.id}
												tone={answer.isCorrect ? "default" : "muted"}
												className={answer.isCorrect ? "text-green-600" : undefined}
											>
												<span className={answer.isCorrect ? "font-semibold" : undefined}>
													{answer.code}. {answer.content}
													{answer.isCorrect && " ✓"}
												</span>
											</Typography>
										))}
									</div>
								)}
								{(!q.answers || q.answers.length === 0) && q.type === "essay" && q.essayCorrectAnswer && (
									<Typography>
										Kunci jawaban: <span className="font-semibold">{q.essayCorrectAnswer}</span>
									</Typography>
								)}
								{Boolean(q.discussion) && (
									<div className="mt-3 border-t border-neutral-200 pt-3">
										<Typography variant="overline" tone="default" as="p" className="mb-1">
											Pembahasan:
										</Typography>
										<TiptapRenderer content={q.discussion} />
									</div>
								)}
							</div>
						}
					/>
				))
			) : (
				<Typography tone="muted">Belum ada latihan soal untuk materi ini.</Typography>
			)}
		</div>
	);
}
