import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import type { QuestionChoice } from "../-types/tryout";
import { AnswerOption } from "./answer-option";

interface AnswerPanelProps {
	tryoutId: number;
	questionId: number;
	choices: QuestionChoice[];
}

export function AnswerPanel({ tryoutId, questionId, choices }: AnswerPanelProps) {
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
		<Card className="flex h-full flex-col overflow-hidden">
			<div className="border-b bg-secondary/50 p-3">
				<span className="font-medium text-sm">Jawaban</span>
			</div>
			<div className="flex-1 grid-cols-1 gap-2 overflow-y-auto p-4">
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
		</Card>
	);
}
