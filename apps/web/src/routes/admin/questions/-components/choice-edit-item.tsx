import { TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChoiceEditItemProps {
	choice: {
		id: number;
		code: string;
		content: string;
		isCorrect: boolean;
	};
	onUpdate: (content: string, isCorrect: boolean) => void;
	onDelete: () => void;
}

export function ChoiceEditItem({ choice, onUpdate, onDelete }: ChoiceEditItemProps) {
	return (
		<div
			className={`flex items-start gap-3 rounded-lg border p-3 ${
				choice.isCorrect ? "border-green-200 bg-green-50" : ""
			}`}
		>
			<div className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted font-bold text-muted-foreground text-xs">
				{choice.code}
			</div>
			<div className="flex flex-1 flex-col gap-2">
				<Input
					value={choice.content}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate(e.target.value, choice.isCorrect)}
					placeholder="Isi pilihan jawaban..."
				/>
				<div className="flex items-center gap-2">
					<Checkbox
						id={`correct-${choice.id}`}
						checked={choice.isCorrect}
						onCheckedChange={(checked) => onUpdate(choice.content, checked === true)}
					/>
					<Label htmlFor={`correct-${choice.id}`} className="cursor-pointer font-normal text-muted-foreground text-xs">
						Jawaban Benar
					</Label>
				</div>
			</div>
			<button
				type="button"
				onClick={onDelete}
				className="mt-1 flex items-center gap-1 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
			>
				<TrashIcon className="size-4" />
				<span className="sr-only">Hapus pilihan</span>
			</button>
		</div>
	);
}
