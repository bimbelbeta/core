import {
	AdminTable,
	AdminTableBody,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
} from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { ComplexChoiceEditRow } from "./complex-choice-edit-row";
import type { Choice } from "./types";

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
		<div className="flex flex-col gap-3">
			<AdminTableRoot>
				<AdminTable>
					<AdminTableHeader className="hidden sm:table-row">
						<AdminTableHead>Pernyataan</AdminTableHead>
						<AdminTableHead className="w-36">Kunci</AdminTableHead>
						<AdminTableHead className="w-12" />
					</AdminTableHeader>
					<AdminTableBody columns={3}>
						{choices.map((choice) => (
							<ComplexChoiceEditRow
								key={choice.id}
								choice={choice}
								onUpdate={(content, isCorrect) => updateChoice(choice.id, content, isCorrect)}
								onDelete={() => deleteChoice(choice.id)}
							/>
						))}
					</AdminTableBody>
				</AdminTable>
			</AdminTableRoot>
			{choices.length < 7 && (
				<Button type="button" variant="outline" size="xs" onClick={addChoice} className="self-start">
					Tambah pernyataan
				</Button>
			)}
		</div>
	);
}
