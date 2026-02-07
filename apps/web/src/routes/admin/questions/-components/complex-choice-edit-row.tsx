import { TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";

interface ComplexChoiceEditRowProps {
	choice: {
		id: number;
		code: string;
		content: string;
		isCorrect: boolean;
	};
	onUpdate: (content: string, isCorrect: boolean) => void;
	onDelete: () => void;
}

export function ComplexChoiceEditRow({ choice, onUpdate, onDelete }: ComplexChoiceEditRowProps) {
	return (
		<TableRow>
			<TableCell>
				<Input
					value={choice.content}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate(e.target.value, choice.isCorrect)}
					placeholder="Isi jawaban..."
				/>
			</TableCell>
			<TableCell>
				<div className="flex items-center justify-center gap-2">
					<Button
						type="button"
						variant={choice.isCorrect ? "default" : "outline"}
						size="sm"
						onClick={() => onUpdate(choice.content, true)}
					>
						Benar
					</Button>
					<Button
						type="button"
						variant={!choice.isCorrect ? "default" : "outline"}
						size="sm"
						onClick={() => onUpdate(choice.content, false)}
					>
						Salah
					</Button>
				</div>
			</TableCell>
			<TableCell>
				<button
					type="button"
					onClick={onDelete}
					className="flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
				>
					<TrashIcon className="size-4" />
				</button>
			</TableCell>
		</TableRow>
	);
}
