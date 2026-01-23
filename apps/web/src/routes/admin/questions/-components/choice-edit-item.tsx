import { TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface ChoiceEditItemProps {
	choice: {
		id: number;
		code: string;
		content: string;
		isCorrect: boolean;
	};
	isUpdating: boolean;
	isDeleting: boolean;
	onUpdate: (content: string, isCorrect: boolean) => void;
	onDelete: () => void;
}

export function ChoiceEditItem({ choice, isUpdating, isDeleting, onUpdate, onDelete }: ChoiceEditItemProps) {
	const [localContent, setLocalContent] = useState(choice.content);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		setLocalContent(choice.content);
	}, [choice.content]);

	const handleContentChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalContent(value);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			onUpdate(value, choice.isCorrect);
		}, 500);
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<div
			className={`relative flex items-start gap-3 rounded-lg border p-3 ${
				choice.isCorrect ? "border-green-200 bg-green-50" : ""
			} ${isUpdating || isDeleting ? "opacity-50" : ""}`}
		>
			{(isUpdating || isDeleting) && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50">
					<Spinner />
				</div>
			)}
			<div className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted font-bold text-muted-foreground text-xs">
				{choice.code}
			</div>
			<div className="flex flex-1 flex-col gap-2">
				<Input
					value={localContent}
					onChange={handleContentChange}
					placeholder="Isi pilihan jawaban..."
					disabled={isUpdating || isDeleting}
				/>
				<div className="flex items-center gap-2">
					<Checkbox
						id={`correct-${choice.id}`}
						checked={choice.isCorrect}
						onCheckedChange={(checked) => onUpdate(localContent, checked === true)}
						disabled={isUpdating || isDeleting}
					/>
					<Label htmlFor={`correct-${choice.id}`} className="cursor-pointer font-normal text-muted-foreground text-xs">
						Jawaban Benar
					</Label>
				</div>
			</div>
			<button
				type="button"
				onClick={onDelete}
				className="mt-1 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
				disabled={isUpdating || isDeleting}
			>
				<TrashIcon className="size-4" />
				<span className="sr-only">Hapus pilihan</span>
			</button>
		</div>
	);
}
