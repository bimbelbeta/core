import { ClipboardTextIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";
import { PasteScoresDialog } from "./paste-scores-dialog";

interface ScoringMapEditorProps {
	subtestId: number;
	questionCount: number;
	initialScoringMap: Record<string, number> | null | undefined;
	onSaveSuccess?: () => void;
}

export function ScoringMapEditor({
	subtestId,
	questionCount,
	initialScoringMap,
	onSaveSuccess,
}: ScoringMapEditorProps) {
	const [scores, setScores] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		for (let i = 1; i <= questionCount; i++) {
			const key = String(i);
			initial[key] = initialScoringMap?.[key]?.toString() ?? "";
		}
		return initial;
	});
	const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);

	const updateMutation = useMutation(
		orpc.admin.tryout.subtest.updateSubtest.mutationOptions({
			onSuccess: () => {
				toast.success("Skoring manual berhasil disimpan");
				onSaveSuccess?.();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleScoreChange = (key: string, value: string) => {
		setScores((prev) => ({ ...prev, [key]: value }));
	};

	const handlePasteScores = (pastedScores: string[]) => {
		const newScores: Record<string, string> = {};
		for (let i = 1; i <= questionCount; i++) {
			const key = String(i);
			newScores[key] = pastedScores[i - 1] ?? "";
		}
		setScores(newScores);
		setIsPasteDialogOpen(false);
	};

	const handleSave = () => {
		const emptyKeys = Object.entries(scores)
			.filter(([_, value]) => value.trim() === "")
			.map(([key]) => key);

		if (emptyKeys.length > 0) {
			toast.error(`Skor untuk benar ${emptyKeys.join(", ")} masih kosong`);
			return;
		}

		const invalidKeys = Object.entries(scores)
			.filter(([_, value]) => Number.isNaN(Number(value)) || Number(value) < 0)
			.map(([key]) => key);

		if (invalidKeys.length > 0) {
			toast.error(`Skor untuk benar ${invalidKeys.join(", ")} tidak valid`);
			return;
		}

		const descendingKeys: string[] = [];
		for (let i = 2; i <= questionCount; i++) {
			const prevScore = Number(scores[String(i - 1)]);
			const currScore = Number(scores[String(i)]);
			if (currScore < prevScore) {
				descendingKeys.push(String(i));
			}
		}

		if (descendingKeys.length > 0) {
			toast.error(`Skor harus naik: benar ${descendingKeys.join(", ")} lebih kecil dari sebelumnya`);
			return;
		}

		const scoringMap: Record<string, number> = {};
		for (const [key, value] of Object.entries(scores)) {
			scoringMap[key] = Number(value);
		}

		updateMutation.mutate({
			id: subtestId,
			scoringMap,
		});
	};

	const handleClear = () => {
		updateMutation.mutate({
			id: subtestId,
			scoringMap: null,
		});
		const empty: Record<string, string> = {};
		for (let i = 1; i <= questionCount; i++) {
			empty[String(i)] = "";
		}
		setScores(empty);
	};

	const hasAnyScore = Object.values(scores).some((v) => v.trim() !== "");
	const allScoresFilled = Object.values(scores).every((v) => v.trim() !== "");

	if (questionCount === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Skoring Manual</CardTitle>
					<CardDescription>Tambahkan soal ke subtest terlebih dahulu sebelum mengatur scoring map.</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Skoring Manual</CardTitle>
				<CardDescription>
					Atur skor berdasarkan jumlah jawaban benar. Jika tidak diatur, akan menggunakan rumus linear (benar/total *
					1000).
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center gap-2">
					<Button type="button" variant="outline" size="sm" onClick={() => setIsPasteDialogOpen(true)}>
						<ClipboardTextIcon className="mr-2 size-4" />
						JSON
					</Button>
					{hasAnyScore && (
						<Button type="button" variant="destructive" size="sm" onClick={handleClear}>
							<TrashSimpleIcon />
							Hapus Semua
						</Button>
					)}
				</div>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{Array.from({ length: questionCount }, (_, i) => i + 1).map((num) => {
						const key = String(num);
						return (
							<div key={key} className="flex items-center gap-2">
								<Label htmlFor={`score-${key}`} className="w-16 shrink-0 text-sm">
									Benar {num}:
								</Label>
								<Input
									id={`score-${key}`}
									type="number"
									min="0"
									max="1000"
									value={scores[key]}
									onChange={(e) => handleScoreChange(key, e.target.value)}
									className="h-8 w-20"
									placeholder="0"
								/>
							</div>
						);
					})}
				</div>

				<div className="flex justify-end gap-2 pt-4">
					<Button type="button" onClick={handleSave} disabled={!allScoresFilled || updateMutation.isPending}>
						{updateMutation.isPending ? "Menyimpan..." : "Simpan Skoring"}
					</Button>
				</div>
			</CardContent>

			<PasteScoresDialog
				open={isPasteDialogOpen}
				onOpenChange={setIsPasteDialogOpen}
				expectedCount={questionCount}
				onPaste={handlePasteScores}
			/>
		</Card>
	);
}
