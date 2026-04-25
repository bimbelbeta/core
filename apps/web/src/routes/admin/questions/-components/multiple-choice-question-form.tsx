import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChoiceEditItem } from "./choice-edit-item";
import type { Choice } from "./types";

interface MultipleChoiceQuestionFormProps {
	choices: Choice[];
	onChoicesChange: (choices: Choice[]) => void;
}

const CHOICE_CODES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export function MultipleChoiceQuestionForm({ choices, onChoicesChange }: MultipleChoiceQuestionFormProps) {
	const addChoice = () => {
		const nextCode = CHOICE_CODES[choices.length];
		if (nextCode) {
			onChoicesChange([...choices, { id: -Date.now(), code: nextCode, content: "", isCorrect: false }]);
		}
	};

	const updateChoice = (id: number, content: string, isCorrect: boolean) => {
		onChoicesChange(
			choices.map((c) => {
				if (c.id === id) return { ...c, content, isCorrect };
				if (isCorrect && c.isCorrect) return { ...c, isCorrect: false };
				return c;
			}),
		);
	};

	const deleteChoice = (id: number) => {
		const filtered = choices.filter((c) => c.id !== id);
		onChoicesChange(filtered.map((c, i) => ({ ...c, code: CHOICE_CODES[i] || c.code })));
	};

	return (
		<div className="space-y-4">
			<Label>Pilihan Jawaban</Label>
			<div className="space-y-3">
				{choices.map((choice) => (
					<ChoiceEditItem
						key={choice.id}
						choice={choice}
						onUpdate={(content, isCorrect) => updateChoice(choice.id, content, isCorrect)}
						onDelete={() => deleteChoice(choice.id)}
					/>
				))}
			</div>
			{choices.length < 7 && (
				<Button type="button" variant="outline" onClick={addChoice}>
					<PlusIcon className="mr-2 size-4" />
					Tambah Pilihan
				</Button>
			)}
		</div>
	);
}
