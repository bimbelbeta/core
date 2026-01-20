import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";

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

	if (!currentQuestion) return null;

	return (
		<div className="flex h-full flex-col overflow-hidden px-4">
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
				) : (
					<Input placeholder="Tuliskan jawabamu disini" className="w-full" />
				)}
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
				selected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50",
				disabled && "cursor-not-allowed opacity-50",
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
