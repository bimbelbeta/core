import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChoiceEditItem } from "./choice-edit-item";

interface MultipleChoiceQuestionFormProps {
	choices: Array<{
		id: number;
		code: string;
		content: string;
		isCorrect: boolean;
	}>;
	onUpdateChoice: (id: number, content: string, isCorrect: boolean) => void;
	onAddChoice: () => void;
	onDeleteChoice: (id: number) => void;
	updatingChoiceId: number | null;
	deletingChoiceId: number | null;
	createChoiceIsPending: boolean;
}

export function MultipleChoiceQuestionForm({
	choices,
	onUpdateChoice,
	onAddChoice,
	onDeleteChoice,
	updatingChoiceId,
	deletingChoiceId,
	createChoiceIsPending,
}: MultipleChoiceQuestionFormProps) {
	return (
		<div className="space-y-4">
			<Label>Pilihan Jawaban</Label>
			<div className="space-y-3">
				{choices.map((choice) => (
					<ChoiceEditItem
						key={choice.id}
						choice={choice}
						isUpdating={updatingChoiceId === choice.id}
						isDeleting={deletingChoiceId === choice.id}
						onUpdate={(content, isCorrect) => onUpdateChoice(choice.id, content, isCorrect)}
						onDelete={() => onDeleteChoice(choice.id)}
					/>
				))}
			</div>
			{choices.length < 7 && (
				<Button type="button" variant="outline" onClick={onAddChoice} disabled={createChoiceIsPending}>
					<PlusIcon className="mr-2 size-4" />
					Tambah Pilihan
				</Button>
			)}
		</div>
	);
}
