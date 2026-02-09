import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PasteScoresDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	expectedCount: number;
	onPaste: (scores: string[]) => void;
}

export function PasteScoresDialog({ open, onOpenChange, expectedCount, onPaste }: PasteScoresDialogProps) {
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handlePaste = () => {
		setError(null);

		// Split by newlines and filter empty lines
		const lines = text
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line !== "");

		if (lines.length !== expectedCount) {
			setError(`Jumlah baris tidak sesuai. Diharapkan ${expectedCount} baris, ditemukan ${lines.length} baris.`);
			return;
		}

		// Validate all lines are numbers
		const invalidLines: number[] = [];
		for (let i = 0; i < lines.length; i++) {
			const num = Number(lines[i]);
			if (Number.isNaN(num) || num < 0) {
				invalidLines.push(i + 1);
			}
		}

		if (invalidLines.length > 0) {
			setError(`Baris ${invalidLines.join(", ")} bukan angka valid.`);
			return;
		}

		onPaste(lines);
		setText("");
	};

	const handleClose = (isOpen: boolean) => {
		if (!isOpen) {
			setText("");
			setError(null);
		}
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Paste Skor</DialogTitle>
					<DialogDescription>
						Paste {expectedCount} skor (satu per baris), dimulai dari skor untuk 1 benar sampai {expectedCount} benar.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={"120\n200\n260\n..."}
						rows={10}
						className="font-mono"
					/>
					{error && <p className="text-red-500 text-sm">{error}</p>}
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => handleClose(false)}>
						Batal
					</Button>
					<Button type="button" onClick={handlePaste} disabled={text.trim() === ""}>
						Terapkan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
