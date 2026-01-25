import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { EssayForm } from "./essay-form";

export function AnswerPanel() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const queryClient = useQueryClient();
	const { answers, setAnswer, complexAnswers, setComplexAnswer, currentQuestion, setEssayAnswer } = useTryoutStore();
	const questionId = currentQuestion?.id;

	const saveAnswerMutation = useMutation(
		orpc.tryout.saveAnswer.mutationOptions({
			onSuccess: (_data, variables) => {
				if (variables.essayAnswer !== undefined) {
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
				if (variables.essayAnswer !== undefined) {
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

	return (
		<div className="flex h-full flex-col">
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
				) : currentQuestion?.type === "multiple_choice_complex" ? (
					<div className="rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Pernyataan</TableHead>
									<TableHead className="w-32 text-center">Pilih</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{currentQuestion.choices?.map((choice) => {
									const isSelected = selectedComplexIds.includes(choice.id);
									return (
										<TableRow key={choice.id}>
											<TableCell>{choice.content}</TableCell>
											<TableCell className="text-center">
												<button
													type="button"
													disabled={saveAnswerMutation.isPending}
													onClick={() => handleToggleComplexCorrect(choice.id)}
													className={cn(
														"mx-auto flex size-8 items-center justify-center rounded-full border-2 transition-colors",
														isSelected
															? "border-primary bg-primary text-primary-foreground"
															: "border-border hover:border-primary/50",
														saveAnswerMutation.isPending && "opacity-50",
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
												</button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
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
