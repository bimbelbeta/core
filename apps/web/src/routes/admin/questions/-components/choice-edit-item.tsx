import { TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import { cn } from "@/lib/utils";

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
		<Item
			variant="outline"
			className={cn(
				"flex-nowrap items-center gap-3 rounded-lg px-3 py-2",
				choice.isCorrect && "border-green-200 bg-green-100/40",
			)}
		>
			<div className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
				{choice.code}
			</div>
			<Input
				value={choice.content}
				onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate(e.target.value, choice.isCorrect)}
				placeholder="Isi pilihan jawaban..."
				className="min-w-0 flex-1"
			/>
			<label
				htmlFor={`correct-${choice.id}`}
				className="text-muted-foreground flex shrink-0 cursor-pointer items-center gap-2"
			>
				<Checkbox
					id={`correct-${choice.id}`}
					checked={choice.isCorrect}
					onCheckedChange={(checked) => onUpdate(choice.content, checked === true)}
				/>
				<span className="text-meta hidden sm:inline">Benar</span>
			</label>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onDelete}
				className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-7 shrink-0 rounded"
			>
				<TrashIcon className="size-4" />
				<span className="sr-only">Hapus pilihan {choice.code}</span>
			</Button>
		</Item>
	);
}
