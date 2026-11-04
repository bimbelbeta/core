import { TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
		<TableRow className={cn(choice.isCorrect && "bg-green-50")}>
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
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onDelete}
					aria-label="Hapus pilihan"
					className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-6 rounded"
				>
					<TrashIcon className="size-4" />
				</Button>
			</TableCell>
		</TableRow>
	);
}
