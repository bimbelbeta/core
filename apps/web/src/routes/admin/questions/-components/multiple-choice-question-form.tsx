import { PlusIcon } from "@phosphor-icons/react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";
import { ChoiceEditItem } from "./choice-edit-item";
import { type Choice, useQuestionMutations } from "./use-question-mutations";

interface MultipleChoiceQuestionFormProps {
	questionId?: number;
	onChoicesChange?: (choices: Choice[]) => void;
}

export function MultipleChoiceQuestionForm({ questionId, onChoicesChange }: MultipleChoiceQuestionFormProps) {
	const { data: questionData } = useQuery(
		orpc.admin.tryout.questions.getQuestion.queryOptions({
			input: questionId ? { id: questionId } : skipToken,
		}),
	);

	const { choices, addChoice, updateChoice, deleteChoice, isAdding, isUpdating, isDeleting } = useQuestionMutations({
		questionId,
		initialChoices: questionData?.choices ?? [],
		onChoicesChange,
	});

	return (
		<div className="space-y-4">
			<Label>Pilihan Jawaban</Label>
			<div className="space-y-3">
				{choices.map((choice) => (
					<ChoiceEditItem
						key={choice.id}
						choice={choice}
						isUpdating={isUpdating === choice.id}
						isDeleting={isDeleting === choice.id}
						onUpdate={(content, isCorrect) => updateChoice(choice.id, content, isCorrect)}
						onDelete={() => deleteChoice(choice.id)}
					/>
				))}
			</div>
			{choices.length < 7 && (
				<Button type="button" variant="outline" onClick={addChoice} disabled={isAdding}>
					<PlusIcon className="mr-2 size-4" />
					Tambah Pilihan
				</Button>
			)}
		</div>
	);
}
