import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import type { BodyOutputs } from "@/utils/orpc";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { EssayForm } from "./essay-form";

type TryoutQuestion = NonNullable<NonNullable<BodyOutputs["tryout"]["find"]>["currentSubtest"]>["questions"][number];
type Choice = TryoutQuestion["choices"][number];

export function AnswerPanel() {
	const { tryoutId: rawTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = parseRouteParamToNumber(rawTryoutId);

	const queryClient = useQueryClient();
	const { answers, setAnswer, complexAnswers, setComplexAnswer, currentQuestion, setEssayAnswer } = useTryoutStore();
	const questionId = currentQuestion?.id;

	const saveAnswerMutation = useMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			onSuccess: (_data, variables) => {
				if ("essayAnswer" in variables && typeof variables.essayAnswer === "string") {
					setEssayAnswer(variables.questionId, variables.essayAnswer);
				}
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
			onError: (error: Error) => {
				toast.error(`Gagal menyimpan jawaban: ${error.message}`);
			},
		}),
	);

	const debouncedSaveAnswerMutation = useDebouncedMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			onSuccess: (_data, variables) => {
				if ("essayAnswer" in variables && typeof variables.essayAnswer === "string") {
					setEssayAnswer(variables.questionId, variables.essayAnswer);
				}
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
			onError: (error: Error) => {
				toast.error(`Gagal menyimpan jawaban: ${error.message}`);
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

	const selectedComplexIds =
		questionId && currentQuestion?.type === "multiple_choice_complex"
			? (complexAnswers[questionId] ?? currentQuestion?.userAnswer?.selectedChoiceIds ?? [])
			: [];

	const handleToggleComplexCorrect = (choiceId: number) => {
		if (!questionId) return;

		const isSelected = selectedComplexIds.includes(choiceId);
		const updated = isSelected ? selectedComplexIds.filter((id) => id !== choiceId) : [...selectedComplexIds, choiceId];

		setComplexAnswer(questionId, updated);
		saveAnswerMutation.mutate({
			tryoutId,
			questionId,
			selectedChoiceIds: updated,
		});
	};

	if (!currentQuestion) return null;

	const isComplexQuestion = currentQuestion.type === "multiple_choice_complex";
	const choices: Choice[] = currentQuestion.choices ?? [];

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className={cn("flex flex-col gap-2", isComplexQuestion && "min-h-0 flex-1 overflow-y-auto pr-1")}>
				{currentQuestion?.type === "multiple_choice" ? (
					choices.map((choice) => (
						<AnswerOption
							key={choice.id}
							code={choice.code}
							content={choice.content}
							selected={selectedAnswerId === choice.id}
							onSelect={() => handleSelectAnswer(choice.id)}
							disabled={saveAnswerMutation.isPending}
						/>
					))
				) : currentQuestion?.type === "multiple_choice_complex" ? (
					<div className="flex flex-col gap-3">
						{choices.map((choice) => {
							const isSelected = selectedComplexIds.includes(choice.id);

							return (
								<button
									key={choice.id}
									type="button"
									aria-pressed={isSelected}
									disabled={saveAnswerMutation.isPending}
									onClick={() => handleToggleComplexCorrect(choice.id)}
									className={cn(
										"flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition-all",
										isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/5",
										saveAnswerMutation.isPending && "opacity-50",
									)}
								>
									<span className="min-w-0 flex-1 whitespace-normal break-words">{choice.content}</span>
									<span
										className={cn(
											"flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
											isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
										)}
									>
										{isSelected && (
											<svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
												<title>Selected</title>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										)}
									</span>
								</button>
							);
						})}
					</div>
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
