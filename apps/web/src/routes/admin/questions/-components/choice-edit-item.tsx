import { ClockIcon, TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
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
			className={`flex items-start gap-3 rounded-lg border p-3 ${
				choice.isCorrect ? "border-green-200 bg-green-50" : ""
			} ${isDeleting ? "opacity-50" : ""}`}
		>
			<div className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted font-bold text-muted-foreground text-xs">
				{choice.code}
			</div>
			<div className="flex flex-1 flex-col gap-2">
				<div className="relative">
					<Input
						value={localContent}
						onChange={handleContentChange}
						placeholder="Isi pilihan jawaban..."
						disabled={isUpdating || isDeleting}
						className={isUpdating ? "pr-8" : ""}
					/>
					{isUpdating && (
						<div className="absolute top-1/2 right-3 -translate-y-1/2">
							<ClockIcon className="size-4 animate-spin text-muted-foreground" />
						</div>
					)}
				</div>
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
				className="mt-1 flex items-center gap-1 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
				disabled={isUpdating || isDeleting}
			>
				{isDeleting ? <ClockIcon className="size-4 animate-spin" /> : <TrashIcon className="size-4" />}
				<span className="sr-only">Hapus pilihan</span>
			</button>
		</div>
	);
}
