import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import type { QuestionChoice } from "../-types/tryout";
import { AnswerOption } from "./answer-option";

interface AnswerPanelProps {
	questionId: number;
	choices: QuestionChoice[];
}

export function AnswerPanel({ questionId, choices }: AnswerPanelProps) {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const queryClient = useQueryClient();
	const { answers, setAnswer } = useTryoutStore();

	const saveAnswerMutation = useMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
		}),
	);

	const selectedAnswerId = answers[questionId];

	const handleSelectAnswer = (choiceId: number) => {
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
				{choices.map((choice) => (
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
