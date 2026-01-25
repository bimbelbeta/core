import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplexChoiceEditRow } from "./complex-choice-edit-row";
import { useQuestionMutations } from "./use-question-mutations";

interface MultipleChoiceComplexQuestionFormProps {
	questionId?: number;
}

export function MultipleChoiceComplexQuestionForm({ questionId }: MultipleChoiceComplexQuestionFormProps) {
	const { choices, addChoice, updateChoice, deleteChoice, isAdding, isUpdating, isDeleting } = useQuestionMutations({
		questionId,
		allowMultipleCorrect: true,
	});

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
								isUpdating={isUpdating === choice.id}
								isDeleting={isDeleting === choice.id}
								onUpdate={(content, isCorrect) => updateChoice(choice.id, content, isCorrect)}
								onDelete={() => deleteChoice(choice.id)}
							/>
						))}
					</TableBody>
				</Table>
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
