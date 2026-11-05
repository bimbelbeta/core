import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, CheckboxIndicator } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item } from "@/components/ui/item";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { orpc } from "@/lib/orpc";
import {
	QUESTION_TYPE_BADGE,
	QUESTION_TYPE_LABELS,
	type QuestionType,
	questionTypeSchema,
	SUBJECT_CATEGORY_LABELS,
	type SubjectCategory,
	subjectCategorySchema,
} from "@/lib/schemas";

type CategoryFilter = "all" | SubjectCategory;
type TypeFilter = "all" | QuestionType;

function isCategoryFilter(v: string): v is CategoryFilter {
	return v === "all" || subjectCategorySchema.allows(v);
}

const isTypeFilter = (v: string): v is TypeFilter => v === "all" || questionTypeSchema.allows(v);

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

	const queryClient = useQueryClient();
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
		orpc.admin.tryout.questions.list.infiniteOptions({
			input: (pageParam) => ({
				after: pageParam,
				limit: 20,
				search: search || undefined,
				category: categoryFilter !== "all" ? categoryFilter : undefined,
				type: typeFilter !== "all" ? typeFilter : undefined,
				excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
			}),
			getNextPageParam: (lastPage) => (lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined),
			initialPageParam: undefined as string | undefined,
		}),
	);

	const questions = data?.pages.flatMap((page) => page.items) ?? [];
	const {
		selectedIds: selectedQuestionIds,
		toggleSelectAll: handleSelectAll,
		toggleSelectOne: handleQuestionToggle,
		clearSelection,
		allSelected,
	} = useBulkSelection(questions, { keepSelection: true });

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || isFetchingNextPage || !hasNextPage) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
			fetchNextPage();
		}
	}, [isFetchingNextPage, hasNextPage, fetchNextPage]);
	const addMutation = useMutation(
		orpc.admin.content.addPracticeQuestions.mutationOptions({
			onSuccess: (result) => {
				toast.success(result.message);
				clearSelection();
				queryClient.invalidateQueries({
					queryKey: orpc.admin.content.listPracticeQuestions.queryKey({
						input: { id: contentId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.subject.findContent.queryKey({
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

	const handleAdd = () => {
		if (selectedQuestionIds.length > 0) {
			addMutation.mutate({
				id: contentId,
				questionIds: selectedQuestionIds,
			});
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Reset state when closing
			clearSelection();
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
							<InputGroup className="w-full bg-white">
								<InputGroupAddon>
									<MagnifyingGlassIcon />
								</InputGroupAddon>
								<InputGroupInput
									value={search}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
									placeholder="Cari soal..."
								/>
							</InputGroup>
						</div>
						<Select
							value={categoryFilter}
							onValueChange={(v) => {
								if (isCategoryFilter(v)) setCategoryFilter(v);
							}}
						>
							<SelectTrigger className="w-28">
								<SelectValue placeholder="Kategori" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua</SelectItem>
								{Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={typeFilter}
							onValueChange={(v) => {
								if (isTypeFilter(v)) setTypeFilter(v);
							}}
						>
							<SelectTrigger className="w-36">
								<SelectValue placeholder="Tipe" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Tipe</SelectItem>
								{Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Select All and Add Button */}
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={allSelected}
								aria-label="Pilih semua soal"
								onCheckedChange={handleSelectAll}
								disabled={questions.length === 0}
							/>
							<span className="text-sm">Pilih yang Tampil ({selectedQuestionIds.length} dipilih)</span>
						</div>
						<Button
							variant="default"
							onClick={handleAdd}
							disabled={selectedQuestionIds.length === 0 || addMutation.isPending}
						>
							{addMutation.isPending ? "Menambahkan..." : `Tambah ${selectedQuestionIds.length} Soal`}
						</Button>
					</div>

					{/* Question List */}
					<div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
						{isPending ? (
							<div className="text-muted-foreground flex animate-pulse items-center justify-center py-8">
								Memuat soal...
							</div>
						) : questions.length === 0 ? (
							<div className="text-muted-foreground flex flex-col items-center justify-center py-8">
								<Typography>Tidak ada soal ditemukan</Typography>
								{excludeIds.length > 0 && (
									<Typography variant="caption" className="mt-1">
										({excludeIds.length} soal sudah ditambahkan)
									</Typography>
								)}
							</div>
						) : (
							<div className="space-y-2">
								{questions.map((question) => (
									<Item
										asChild
										variant="outline"
										selected={selectedQuestionIds.includes(question.id)}
										key={question.id}
										className="group hover:bg-muted/50 w-full cursor-pointer flex-nowrap items-start gap-3 rounded-lg p-3 text-left text-base"
									>
										<button
											type="button"
											aria-pressed={selectedQuestionIds.includes(question.id)}
											onClick={() => handleQuestionToggle(question.id)}
										>
											<CheckboxIndicator checked={selectedQuestionIds.includes(question.id)} className="mt-0.5" />
											<div className="min-w-0 flex-1 space-y-1">
												<div className="flex items-start gap-2">
													<span className="text-muted-foreground shrink-0 font-mono text-xs">#{question.id}</span>
													<div className="prose prose-sm line-clamp-2 min-w-0 flex-1 text-sm [&_*]:!m-0 [&_p]:line-clamp-2">
														<TiptapRenderer content={question.content} />
													</div>
												</div>
												<div className="flex flex-wrap items-center gap-1.5">
													<Badge variant={QUESTION_TYPE_BADGE[question.type]} className="text-xs">
														{QUESTION_TYPE_LABELS[question.type]}
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
									</Item>
								))}
								{isFetchingNextPage && (
									<div className="text-muted-foreground flex animate-pulse items-center justify-center py-4 text-sm">
										Memuat lebih banyak soal...
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
