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
import { Typography } from "@/components/ui/typography";

interface PasteScoresDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	expectedCount: number;
	onPaste: (scores: string[]) => void;
}

const parseScores = (value: string) =>
	value
		.split(/[\s,;]+/)
		.map((token) => token.trim())
		.filter((token) => token !== "");

export function PasteScoresDialog({ open, onOpenChange, expectedCount, onPaste }: PasteScoresDialogProps) {
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);

	const parsedScores = parseScores(text);

	const handlePaste = () => {
		setError(null);

		if (parsedScores.length > expectedCount) {
			setError(`Maksimal ${expectedCount} skor, ditemukan ${parsedScores.length}.`);
			return;
		}

		const invalidScores: number[] = [];
		for (let i = 0; i < parsedScores.length; i++) {
			const score = Number(parsedScores[i]);
			if (Number.isNaN(score) || score < 0) {
				invalidScores.push(i + 1);
			}
		}

		if (invalidScores.length > 0) {
			setError(`Skor ke-${invalidScores.join(", ")} bukan angka valid.`);
			return;
		}

		onPaste(parsedScores);
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
					<DialogTitle>Tempel skor</DialogTitle>
					<DialogDescription>
						Tempel skor mulai dari 1 jawaban benar, dipisah baris, spasi, atau koma. Sisanya memakai rumus linear.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={"167\n333\n500\n..."}
						rows={10}
						className="tabular-nums"
					/>
					<Typography variant="caption" className="tabular-nums">
						{parsedScores.length} / {expectedCount} skor
					</Typography>
					{error && (
						<Typography variant="body" tone="destructive">
							{error}
						</Typography>
					)}
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => handleClose(false)}>
						Batal
					</Button>
					<Button type="button" onClick={handlePaste} disabled={parsedScores.length === 0}>
						Terapkan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
