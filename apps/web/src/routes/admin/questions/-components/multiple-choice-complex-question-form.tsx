import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplexChoiceEditRow } from "./complex-choice-edit-row";
import type { Choice } from "./edit-question-form";

interface MultipleChoiceComplexQuestionFormProps {
	choices: Choice[];
	onChoicesChange: (choices: Choice[]) => void;
}

const CHOICE_CODES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export function MultipleChoiceComplexQuestionForm({
	choices,
	onChoicesChange,
}: MultipleChoiceComplexQuestionFormProps) {
	const addChoice = () => {
		const nextCode = CHOICE_CODES[choices.length];
		if (nextCode) {
			onChoicesChange([...choices, { id: -Date.now(), code: nextCode, content: "", isCorrect: false }]);
		}
	};

	const updateChoice = (id: number, content: string, isCorrect: boolean) => {
		onChoicesChange(choices.map((c) => (c.id === id ? { ...c, content, isCorrect } : c)));
	};

	const deleteChoice = (id: number) => {
		const filtered = choices.filter((c) => c.id !== id);
		onChoicesChange(filtered.map((c, i) => ({ ...c, code: CHOICE_CODES[i] || c.code })));
	};

	return (
		<div className="space-y-4">
			<Label>Pilihan Jawaban (Kompleks)</Label>
			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Jawaban</TableHead>
							<TableHead className="w-32 text-center">Kunci</TableHead>
							<TableHead className="w-16" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{choices.map((choice) => (
							<ComplexChoiceEditRow
								key={choice.id}
								choice={choice}
								onUpdate={(content, isCorrect) => updateChoice(choice.id, content, isCorrect)}
								onDelete={() => deleteChoice(choice.id)}
							/>
						))}
					</TableBody>
				</Table>
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
