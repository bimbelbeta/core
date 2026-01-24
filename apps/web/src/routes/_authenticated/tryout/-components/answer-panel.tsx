import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { EssayForm } from "./essay-form";

export function AnswerPanel() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const queryClient = useQueryClient();
	const { answers, setAnswer, currentQuestion, setEssayAnswer } = useTryoutStore();
	const questionId = currentQuestion?.id;

	const saveAnswerMutation = useMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			onSuccess: (_data, variables) => {
				if (variables.essayAnswer !== undefined) {
					setEssayAnswer(variables.questionId, variables.essayAnswer);
				}
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
		}),
	);

	const debouncedSaveAnswerMutation = useDebouncedMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			onSuccess: (_data, variables) => {
				if (variables.essayAnswer !== undefined) {
					setEssayAnswer(variables.questionId, variables.essayAnswer);
				}
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
		}),
		500,
	);
	const selectedAnswerId = questionId
		? (answers[questionId] ?? currentQuestion?.userAnswer?.selectedChoiceId)
		: undefined;

	const handleSelectAnswer = (choiceId: number) => {
		if (!questionId) return;
		setAnswer(questionId, choiceId);
		saveAnswerMutation.mutate({
			tryoutId,
			questionId,
			selectedChoiceId: choiceId,
		});
	};

	const handleSaveEssayAnswer = (data: { tryoutId: number; questionId: number; essayAnswer: string }) => {
		debouncedSaveAnswerMutation.debouncedMutate(data);
	};

	if (!currentQuestion) return null;

	return (
		<div className="flex h-full flex-col overflow-hidden lg:px-4">
			<div className="flex flex-col gap-2">
				{currentQuestion?.type === "multiple_choice" ? (
					currentQuestion.choices?.map((choice) => (
						<AnswerOption
							key={choice.id}
							code={choice.code}
							content={choice.content}
							selected={selectedAnswerId === choice.id}
							onSelect={() => handleSelectAnswer(choice.id)}
							disabled={saveAnswerMutation.isPending}
						/>
					))
				) : questionId ? (
					<EssayForm
						key={questionId}
						tryoutId={tryoutId}
						questionId={questionId}
						saveAnswer={handleSaveEssayAnswer}
						isPending={debouncedSaveAnswerMutation.isPending}
					/>
				) : null}
			</div>
		</div>
	);
}

function AnswerOption({
	code,
	content,
	selected,
	onSelect,
	disabled,
}: {
	code: string;
	content: string;
	selected: boolean;
	onSelect: () => void;
	disabled: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onSelect}
			className={cn(
				"flex items-center gap-3 rounded-md border p-4 text-start transition-all",
				selected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/5",
				disabled && "opacity-50",
			)}
		>
			<span
				className={cn(
					"rounded-xs border border-foreground/20 px-2.5 py-0.5 font-medium text-sm",
					selected && "bg-primary text-primary-foreground",
				)}
			>
				{code}
			</span>
			{content}
		</button>
	);
}
