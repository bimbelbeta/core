import { TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { AdminTableCell, AdminTableRow } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
		<AdminTableRow className={cn(choice.isCorrect && "bg-green-100/40")}>
			<AdminTableCell>
				<Input
					value={choice.content}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate(e.target.value, choice.isCorrect)}
					placeholder="Isi jawaban..."
				/>
			</AdminTableCell>
			<AdminTableCell>
				<div className="flex items-center justify-center gap-2">
					<Button
						type="button"
						variant={choice.isCorrect ? "default" : "outline"}
						size="xs"
						onClick={() => onUpdate(choice.content, true)}
						aria-pressed={choice.isCorrect}
						aria-label={`Tandai pilihan ${choice.code} benar`}
					>
						Benar
					</Button>
					<Button
						type="button"
						variant={!choice.isCorrect ? "default" : "outline"}
						size="xs"
						onClick={() => onUpdate(choice.content, false)}
						aria-pressed={!choice.isCorrect}
						aria-label={`Tandai pilihan ${choice.code} salah`}
					>
						Salah
					</Button>
				</div>
			</AdminTableCell>
			<AdminTableCell>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onDelete}
					aria-label={`Hapus pilihan ${choice.code}`}
					className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-7 rounded"
				>
					<TrashIcon className="size-4" />
				</Button>
			</AdminTableCell>
		</AdminTableRow>
	);
}
