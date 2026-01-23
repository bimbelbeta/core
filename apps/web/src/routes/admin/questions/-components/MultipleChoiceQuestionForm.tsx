import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChoiceEditItem } from "./choice-edit-item";
import { useQuestionMutations } from "./use-question-mutations";

interface MultipleChoiceQuestionFormProps {
	questionId?: number;
}

export function MultipleChoiceQuestionForm({ questionId }: MultipleChoiceQuestionFormProps) {
	const { choices, addChoice, updateChoice, deleteChoice, isAdding, isUpdating, isDeleting } = useQuestionMutations({
		questionId,
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
