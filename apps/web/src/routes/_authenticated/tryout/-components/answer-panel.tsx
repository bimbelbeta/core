import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { AnswerOption } from "./answer-option";

export function AnswerPanel() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const queryClient = useQueryClient();
	const { answers, setAnswer, currentQuestion } = useTryoutStore();
	const questionId = currentQuestion?.id;

	const saveAnswerMutation = useMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
		}),
	);
	const selectedAnswerId = questionId ? answers[questionId] : undefined;

	const handleSelectAnswer = (choiceId: number) => {
		if (!questionId) return;
		setAnswer(questionId, choiceId);
		saveAnswerMutation.mutate({
			tryoutId,
			questionId,
			selectedChoiceId: choiceId,
		});
	};

	return (
		<div className="flex h-full flex-col overflow-hidden px-4">
			<div className="flex flex-col gap-2">
				{currentQuestion?.choices?.map((choice) => (
					<AnswerOption
						key={choice.id}
						code={choice.code}
						content={choice.content}
						selected={selectedAnswerId === choice.id}
						onSelect={() => handleSelectAnswer(choice.id)}
						disabled={saveAnswerMutation.isPending}
					/>
				))}
			</div>
		</div>
	);
}
