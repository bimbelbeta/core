import { ArrowCounterClockwiseIcon, ArrowRightIcon, ClipboardTextIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { orpc } from "@/lib/orpc";
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
		orpc.admin.tryout.subtest.update.mutationOptions({
			onSuccess: () => {
				toast.success("Skoring manual berhasil disimpan");
				onSaveSuccess?.();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const linearScore = (correctCount: number) => Math.round((correctCount / questionCount) * 1000);

	const effectiveScore = (key: string) => {
		const value = scores[key]?.trim();
		return value ? Number(value) : linearScore(Number(key));
	};

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
		const scoringMap: Record<string, number> = {};
		const invalidKeys: string[] = [];

		for (const [key, value] of Object.entries(scores)) {
			const trimmed = value.trim();
			if (trimmed === "") continue;

			const score = Number(trimmed);
			if (Number.isNaN(score) || score < 0) {
				invalidKeys.push(key);
				continue;
			}

			scoringMap[key] = score;
		}

		if (invalidKeys.length > 0) {
			toast.error(`Skor untuk benar ${invalidKeys.join(", ")} tidak valid`);
			return;
		}

		const descendingKeys: string[] = [];
		for (let i = 2; i <= questionCount; i++) {
			if (effectiveScore(String(i)) < effectiveScore(String(i - 1))) {
				descendingKeys.push(String(i));
			}
		}

		if (descendingKeys.length > 0) {
			toast.error(`Skor harus naik: benar ${descendingKeys.join(", ")} lebih kecil dari sebelumnya`);
			return;
		}

		updateMutation.mutate({
			id: subtestId,
			scoringMap: Object.keys(scoringMap).length > 0 ? scoringMap : null,
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

	const hasAnyScore = Object.values(scores).some((value) => value.trim() !== "");

	if (questionCount === 0) {
		return (
			<AdminSection
				title="Skoring manual"
				description="Tambahkan soal ke subtest terlebih dahulu sebelum mengatur scoring map."
			/>
		);
	}

	return (
		<AdminSection
			title="Skoring manual"
			description="Atur skor untuk tiap jumlah jawaban benar. Kosongkan untuk memakai rumus linear (benar/total × 1000)."
		>
			<div className="flex w-full max-w-[880px] flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="text-muted-foreground text-meta flex items-center gap-1.5">
						<span>Jumlah benar</span>
						<ArrowRightIcon className="size-3" />
						<span>Skor</span>
					</div>
					<Button type="button" variant="outline" size="xs" onClick={() => setIsPasteDialogOpen(true)}>
						<ClipboardTextIcon className="size-3.5" />
						Tempel skor
					</Button>
				</div>

				<div className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2">
					{Array.from({ length: questionCount }, (_, i) => i + 1).map((num) => {
						const key = String(num);
						return (
							<InputGroup key={key} className="h-8">
								<InputGroupAddon className="text-muted-foreground pr-1 pl-2 text-xs font-normal tabular-nums">
									{num}
								</InputGroupAddon>
								<InputGroupInput
									type="number"
									min="0"
									max="1000"
									value={scores[key] ?? ""}
									onChange={(e) => handleScoreChange(key, e.target.value)}
									placeholder={String(linearScore(num))}
									aria-label={`Skor untuk ${num} jawaban benar`}
									className="h-8 tabular-nums"
								/>
							</InputGroup>
						);
					})}
				</div>

				<div className="flex items-center justify-end gap-1">
					{hasAnyScore && (
						<Button type="button" variant="ghost" size="xs" onClick={handleClear}>
							<ArrowCounterClockwiseIcon className="size-3.5" />
							Kembalikan ke linear
						</Button>
					)}
					<Button
						isPending={updateMutation.isPending}
						type="button"
						size="xs"
						onClick={handleSave}
						disabled={updateMutation.isPending}
					>
						<FloppyDiskIcon className="size-3.5" />
						Simpan skoring
					</Button>
				</div>
			</div>

			<PasteScoresDialog
				open={isPasteDialogOpen}
				onOpenChange={setIsPasteDialogOpen}
				expectedCount={questionCount}
				onPaste={handlePasteScores}
			/>
		</AdminSection>
	);
}
