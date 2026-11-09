import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import { Item } from "@/components/ui/item";
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation";
import type { BodyOutputs } from "@/lib/orpc";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import { updateTryoutAnswerCache, useTryoutStore } from "../-hooks/use-tryout-store";
import { EssayForm } from "./essay-form";

type TryoutQuestion = NonNullable<NonNullable<BodyOutputs["tryout"]["find"]>["currentSubtest"]>["questions"][number];
type Choice = TryoutQuestion["choices"][number];

interface QuestionMutationState {
	requestSeq: number;
	confirmedSeq: number;
	confirmedChoiceId: number | null;
	confirmedComplexIds: number[] | null;
}

export function AnswerPanel() {
	const { tryoutId: rawTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = parseRouteParamToNumber(rawTryoutId);

	const queryClient = useQueryClient();
	const {
		answers,
		setAnswer,
		removeAnswer,
		complexAnswers,
		setComplexAnswer,
		removeComplexAnswer,
		currentQuestion,
		setEssayAnswer,
	} = useTryoutStore();
	const questionId = currentQuestion?.id;
	const mutationStateRef = useRef<Record<number, QuestionMutationState>>({});

	const saveAnswerMutation = useMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			retry: 2,
			retryDelay: 1000,
			networkMode: "always",
			onMutate: async (variables) => {
				const qId = variables.questionId;
				const current = mutationStateRef.current[qId] ?? {
					requestSeq: 0,
					confirmedSeq: 0,
					confirmedChoiceId: currentQuestion?.userAnswer?.selectedChoiceId ?? null,
					confirmedComplexIds: currentQuestion?.userAnswer?.selectedChoiceIds ?? null,
				};
				const seq = current.requestSeq + 1;
				mutationStateRef.current[qId] = {
					...current,
					requestSeq: seq,
				};

				if (variables.answerType === "choice") {
					setAnswer(qId, variables.selectedChoiceId);
				} else if (variables.answerType === "complex") {
					setComplexAnswer(qId, variables.selectedChoiceIds);
				} else if (variables.answerType === "essay") {
					setEssayAnswer(qId, variables.essayAnswer);
				}

				const queryKey = orpc.tryout.find.queryKey({ input: { id: tryoutId } });
				await queryClient.cancelQueries({ queryKey });

				return { seq, queryKey };
			},
			onSuccess: (_data, variables, context) => {
				const qId = variables.questionId;
				const state = mutationStateRef.current[qId];
				if (!context || !state || context.seq < state.confirmedSeq) {
					return;
				}

				mutationStateRef.current[qId] = {
					...state,
					confirmedSeq: context.seq,
					confirmedChoiceId: variables.answerType === "choice" ? variables.selectedChoiceId : state.confirmedChoiceId,
					confirmedComplexIds:
						variables.answerType === "complex" ? variables.selectedChoiceIds : state.confirmedComplexIds,
				};

				queryClient.setQueryData(context.queryKey, (old) => updateTryoutAnswerCache(old, variables));
			},
			onError: (error, variables, context) => {
				const qId = variables.questionId;
				const state = mutationStateRef.current[qId];
				if (!context || !state || context.seq !== state.requestSeq) {
					return;
				}

				if (variables.answerType === "choice") {
					const confirmed = state.confirmedChoiceId;
					if (confirmed !== undefined && confirmed !== null) {
						setAnswer(qId, confirmed);
					} else {
						removeAnswer(qId);
					}
				} else if (variables.answerType === "complex") {
					const confirmed = state.confirmedComplexIds;
					if (confirmed !== undefined && confirmed !== null) {
						setComplexAnswer(qId, confirmed);
					} else {
						removeComplexAnswer(qId);
					}
				}

				toast.error(`Gagal menyimpan jawaban: ${error.message}`);
			},
		}),
	);

	const debouncedSaveAnswerMutation = useDebouncedMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			networkMode: "always",
			onSuccess: (_data, variables) => {
				if ("essayAnswer" in variables && typeof variables.essayAnswer === "string") {
					setEssayAnswer(variables.questionId, variables.essayAnswer);
				}
				queryClient.setQueryData(orpc.tryout.find.queryKey({ input: { id: tryoutId } }), (old) =>
					updateTryoutAnswerCache(old, variables),
				);
			},
			onError: (error) => {
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
		saveAnswerMutation.mutate({
			tryoutId,
			questionId,
			answerType: "choice",
			selectedChoiceId: choiceId,
		});
	};

	const handleSaveEssayAnswer = (data: { tryoutId: number; questionId: number; essayAnswer: string }) => {
		debouncedSaveAnswerMutation.debouncedMutate({ ...data, answerType: "essay" as const });
	};

	const selectedComplexIds =
		questionId && currentQuestion?.type === "multiple_choice_complex"
			? (complexAnswers[questionId] ?? currentQuestion?.userAnswer?.selectedChoiceIds ?? [])
			: [];

	const handleToggleComplexCorrect = (choiceId: number) => {
		if (!questionId) return;

		const isSelected = selectedComplexIds.includes(choiceId);
		const updated = isSelected ? selectedComplexIds.filter((id) => id !== choiceId) : [...selectedComplexIds, choiceId];

		saveAnswerMutation.mutate({
			tryoutId,
			questionId,
			answerType: "complex",
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
					<fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
						<legend className="sr-only">Pilih satu jawaban</legend>
						{choices.map((choice) => (
							<AnswerOption
								key={choice.id}
								code={choice.code}
								content={choice.content}
								selected={selectedAnswerId === choice.id}
								onSelect={() => handleSelectAnswer(choice.id)}
							/>
						))}
					</fieldset>
				) : currentQuestion?.type === "multiple_choice_complex" ? (
					<div className="flex flex-col gap-3">
						{choices.map((choice) => {
							const isSelected = selectedComplexIds.includes(choice.id);

							return (
								<Item
									key={choice.id}
									variant="outline"
									selected={isSelected}
									asChild
									className={cn(
										"w-full flex-nowrap items-start justify-between gap-3 rounded-lg text-left text-base",
										!isSelected && "hover:bg-secondary/5",
									)}
								>
									<button
										type="button"
										aria-pressed={isSelected}
										className="touch-manipulation"
										onClick={() => handleToggleComplexCorrect(choice.id)}
									>
										<span className="min-w-0 flex-1 break-words whitespace-normal">{choice.content}</span>
										<span
											className={cn(
												"flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
												isSelected
													? "border-primary bg-primary text-primary-foreground"
													: "border-border bg-background",
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
								</Item>
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
}: {
	code: string;
	content: string;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<Item
			variant="outline"
			selected={selected}
			asChild
			className={cn("flex-nowrap gap-3 text-start text-base", !selected && "hover:bg-secondary/5")}
		>
			<label className="flex w-full cursor-pointer touch-manipulation flex-nowrap items-center gap-3">
				<input type="radio" className="sr-only" checked={selected} onChange={onSelect} />
				<span
					className={cn(
						"border-foreground/20 rounded-xs border px-2.5 py-0.5 text-sm font-medium",
						selected && "bg-primary text-primary-foreground",
					)}
				>
					{code}
				</span>
				{content}
			</label>
		</Item>
	);
}
