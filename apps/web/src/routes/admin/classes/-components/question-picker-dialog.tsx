import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orpc } from "@/utils/orpc";

type CategoryFilter = "all" | "sd" | "smp" | "sma" | "utbk";
type TypeFilter = "all" | "multiple_choice" | "essay";

interface QuestionPickerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	contentId: number;
	excludeIds: number[];
}

export function QuestionPickerDialog({
	open,
	onOpenChange,
	onSuccess,
	contentId,
	excludeIds,
}: QuestionPickerDialogProps) {
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());

	const queryClient = useQueryClient();

	const { data: questionsData, isPending } = useQuery(
		orpc.admin.tryout.questions.listQuestions.queryOptions({
			input: {
				page: 1,
				limit: 100,
				search: search || undefined,
				category: categoryFilter !== "all" ? categoryFilter : undefined,
				type: typeFilter !== "all" ? typeFilter : undefined,
				excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
			},
		}),
	);

	const addMutation = useMutation(
		orpc.admin.subject.addPracticeQuestions.mutationOptions({
			onSuccess: (result) => {
				toast.success(result.message);
				setSelectedQuestionIds(new Set());
				queryClient.invalidateQueries({
					queryKey: orpc.admin.subject.getContentPracticeQuestions.queryKey({
						input: { id: contentId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.subject.getContentById.queryKey({
						input: { contentId },
					}),
				});
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const questions = questionsData?.questions ?? [];

	const handleSelectAll = () => {
		if (selectedQuestionIds.size === questions.length) {
			setSelectedQuestionIds(new Set());
		} else {
			setSelectedQuestionIds(new Set(questions.map((q) => q.id)));
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
			addMutation.mutate({
				id: contentId,
				questionIds: Array.from(selectedQuestionIds),
			});
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Reset state when closing
			setSelectedQuestionIds(new Set());
			setSearch("");
			setCategoryFilter("all");
			setTypeFilter("all");
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
				<DialogHeader className="shrink-0">
					<DialogTitle>Tambah Latihan Soal</DialogTitle>
					<DialogDescription>Pilih soal dari bank soal untuk ditambahkan ke konten ini.</DialogDescription>
				</DialogHeader>

				<div className="flex flex-1 flex-col gap-4 overflow-hidden">
					{/* Search and Filters */}
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex-1">
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Cari soal..."
								className="w-full"
							/>
						</div>
						<Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
							<SelectTrigger className="w-28">
								<SelectValue placeholder="Kategori" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua</SelectItem>
								<SelectItem value="sd">SD</SelectItem>
								<SelectItem value="smp">SMP</SelectItem>
								<SelectItem value="sma">SMA</SelectItem>
								<SelectItem value="utbk">UTBK</SelectItem>
							</SelectContent>
						</Select>
						<Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
							<SelectTrigger className="w-36">
								<SelectValue placeholder="Tipe" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Tipe</SelectItem>
								<SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
								<SelectItem value="essay">Esai</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Select All and Add Button */}
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={questions.length > 0 && selectedQuestionIds.size === questions.length}
								onCheckedChange={handleSelectAll}
								disabled={questions.length === 0}
							/>
							<Label className="cursor-pointer text-sm">Pilih Semua ({selectedQuestionIds.size} dipilih)</Label>
						</div>
						<Button
							variant="default"
							onClick={handleAdd}
							disabled={selectedQuestionIds.size === 0 || addMutation.isPending}
						>
							{addMutation.isPending ? "Menambahkan..." : `Tambah ${selectedQuestionIds.size} Soal`}
						</Button>
					</div>

					{/* Question List */}
					<div className="flex-1 overflow-y-auto">
						{isPending ? (
							<div className="flex animate-pulse items-center justify-center py-8 text-muted-foreground">
								Memuat soal...
							</div>
						) : questions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
								<p>Tidak ada soal ditemukan</p>
								{excludeIds.length > 0 && <p className="mt-1 text-xs">({excludeIds.length} soal sudah ditambahkan)</p>}
							</div>
						) : (
							<div className="space-y-2">
								{questions.map((question) => (
									<button
										type="button"
										key={question.id}
										className="group flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
										onClick={() => handleQuestionToggle(question.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleQuestionToggle(question.id);
											}
										}}
									>
										<Checkbox
											checked={selectedQuestionIds.has(question.id)}
											onCheckedChange={() => handleQuestionToggle(question.id)}
											className="mt-0.5"
										/>
										<div className="min-w-0 flex-1 space-y-1">
											<div className="flex items-start gap-2">
												<span className="shrink-0 font-mono text-muted-foreground text-xs">#{question.id}</span>
												<div className="prose prose-sm [&_*]:!m-0 line-clamp-2 min-w-0 flex-1 text-sm [&_p]:line-clamp-2">
													<TiptapRenderer content={question.content} />
												</div>
											</div>
											<div className="flex flex-wrap items-center gap-1.5">
												<Badge
													variant={question.type === "multiple_choice" ? "default" : "outline"}
													className="text-xs"
												>
													{question.type === "multiple_choice" ? "PG" : "Esai"}
												</Badge>
												{question.tags?.slice(0, 3).map((tag) => (
													<Badge key={tag} variant="secondary" className="text-xs">
														{tag}
													</Badge>
												))}
												{question.tags && question.tags.length > 3 && (
													<span className="text-muted-foreground text-xs">+{question.tags.length - 3}</span>
												)}
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
