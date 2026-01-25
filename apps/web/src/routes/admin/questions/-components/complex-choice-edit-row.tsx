import { ClockIcon, TrashIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";

interface Choice {
	id: number;
	code: string;
	content: string;
	isCorrect: boolean;
}

interface ComplexChoiceEditRowProps {
	choice: Choice;
	isUpdating: boolean;
	isDeleting: boolean;
	onUpdate: (content: string, isCorrect: boolean) => void;
	onDelete: () => void;
}

export function ComplexChoiceEditRow({
	choice,
	isUpdating,
	isDeleting,
	onUpdate,
	onDelete,
}: ComplexChoiceEditRowProps) {
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
		<TableRow>
			<TableCell>
				<div className="relative">
					<Input
						value={localContent}
						onChange={handleContentChange}
						placeholder="Isi jawaban..."
						disabled={isUpdating || isDeleting}
						className={isUpdating ? "pr-8" : ""}
					/>
					{isUpdating && (
						<div className="absolute top-1/2 right-3 -translate-y-1/2">
							<ClockIcon className="size-4 animate-spin text-muted-foreground" />
						</div>
					)}
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center justify-center gap-2">
					<Button
						type="button"
						variant={choice.isCorrect ? "default" : "outline"}
						size="sm"
						onClick={() => onUpdate(localContent, true)}
						disabled={isUpdating || isDeleting}
					>
						Benar
					</Button>
					<Button
						type="button"
						variant={!choice.isCorrect ? "default" : "outline"}
						size="sm"
						onClick={() => onUpdate(localContent, false)}
						disabled={isUpdating || isDeleting}
					>
						Salah
					</Button>
				</div>
			</TableCell>
			<TableCell>
				<button
					type="button"
					onClick={onDelete}
					className="flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
					disabled={isUpdating || isDeleting}
				>
					{isDeleting ? (
						<div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<TrashIcon className="size-4" />
					)}
				</button>
			</TableCell>
		</TableRow>
	);
}
