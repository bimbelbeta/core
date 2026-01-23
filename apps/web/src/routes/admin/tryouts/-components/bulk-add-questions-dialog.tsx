import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";

export function BulkAddQuestionsDialog({
	open,
	onOpenChange,
	onSuccess,
	subtestId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	subtestId: number;
}) {
	const [search, setSearch] = useState("");
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());

	const { data: allQuestions, isPending } = useQuery(
		orpc.admin.tryout.questions.listQuestions.queryOptions({
			input: {
				page: 1,
				limit: 100,
				search: search || undefined,
			},
		}),
	);

	const questionsData = allQuestions as unknown as {
		questions: Array<{ id: number; type: string; content: string }>;
		total: number;
		page: number;
		limit: number;
	};

	const bulkAddMutation = useMutation(
		orpc.admin.tryout.questionsBulk.bulkAddQuestionsToSubtest.mutationOptions({
			onSuccess: (result) => {
				toast.success(`${result.addedCount} soal berhasil ditambahkan`);
				setSelectedQuestionIds(new Set());
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleSelectAll = () => {
		if (questionsData?.questions && selectedQuestionIds.size === questionsData.questions.length) {
			setSelectedQuestionIds(new Set());
		} else if (questionsData?.questions) {
			setSelectedQuestionIds(new Set(questionsData.questions.map((q) => q.id)));
		}
	};

	const handleQuestionToggle = (id: number) => {
		const newSelectedIds = new Set(selectedQuestionIds);
		if (newSelectedIds.has(id)) {
			newSelectedIds.delete(id);
		} else {
			newSelectedIds.add(id);
		}
		setSelectedQuestionIds(newSelectedIds);
	};

	const handleAdd = () => {
		if (selectedQuestionIds.size > 0) {
			bulkAddMutation.mutate({
				subtestId,
				questionIds: Array.from(selectedQuestionIds),
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-125">
				<DialogHeader className="shrink-0">
					<DialogTitle>Tambah Soal Massal</DialogTitle>
					<DialogDescription>Pilih soal dari bank soal untuk ditambahkan ke subtest.</DialogDescription>
				</DialogHeader>
				<div className="flex flex-1 flex-col gap-4 overflow-hidden">
					<div className="flex items-center gap-4">
						<Label className="shrink-0">Cari Soal:</Label>
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Ketik untuk mencari soal..."
							className="flex-1"
						/>
					</div>

					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={questionsData ? selectedQuestionIds.size === questionsData.questions.length : false}
								onCheckedChange={handleSelectAll}
							/>
							<Label className="cursor-pointer">Pilih Semua ({selectedQuestionIds.size} dipilih)</Label>
						</div>
						<Button
							variant="default"
							onClick={handleAdd}
							disabled={selectedQuestionIds.size === 0 || bulkAddMutation.isPending}
						>
							{bulkAddMutation.isPending ? "Menambahkan..." : `Tambah ${selectedQuestionIds.size} Soal`}
						</Button>
					</div>

					<div className="max-h-[calc(85vh-14rem)] flex-1 overflow-y-auto">
						{isPending ? (
							<div className="flex animate-pulse items-center justify-center py-8 text-muted-foreground">
								Memuat soal...
							</div>
						) : !questionsData || questionsData.questions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
								Tidak ada soal ditemukan
							</div>
						) : (
							<div className="space-y-2">
								{questionsData.questions.map((question) => (
									<div
										key={question.id}
										className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
									>
										<Checkbox
											checked={selectedQuestionIds.has(question.id)}
											onCheckedChange={(_checked) => handleQuestionToggle(question.id)}
											className="mt-0.5"
										/>
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-2">
												<span className="font-mono text-muted-foreground text-xs">#{question.id}</span>
												<TiptapRenderer content={question.content} />
												<Badge variant={question.type === "multiple_choice" ? "default" : "outline"}>
													{question.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
												</Badge>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
