import { CheckCircleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item } from "@/components/ui/item";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

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
	const [addedIds, setAddedIds] = useState<number[]>([]);

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

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || isFetchingNextPage || !hasNextPage) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
			fetchNextPage();
		}
	}, [isFetchingNextPage, hasNextPage, fetchNextPage]);

	const addMutation = useMutation(
		orpc.admin.content.addPracticeQuestions.mutationOptions({
			onSuccess: (result, variables) => {
				toast.success(result.message);
				setAddedIds((prev) => [...prev, ...variables.questionIds]);
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
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleAttach = (questionId: number) => {
		if (addMutation.isPending) return;
		addMutation.mutate({ id: contentId, questionIds: [questionId] });
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setSearch("");
			setCategoryFilter("all");
			setTypeFilter("all");
			setAddedIds([]);
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
				<DialogHeader className="shrink-0">
					<DialogTitle className="text-base">Tambah Latihan Soal</DialogTitle>
					<DialogDescription>
						Klik soal untuk langsung menambahkannya ke konten ini. Dialog tetap terbuka agar soal berikutnya bisa
						ditambahkan.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-1 flex-col gap-4 overflow-hidden">
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
								<SelectItem value="all">Semua tipe</SelectItem>
								{Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
						{isPending ? (
							<div className="text-muted-foreground flex animate-pulse items-center justify-center py-8">
								Memuat soal...
							</div>
						) : questions.length === 0 ? (
							<div className="text-muted-foreground flex flex-col items-center justify-center py-8">
								<p>Tidak ada soal ditemukan</p>
								{excludeIds.length > 0 && (
									<p className="text-meta mt-1">({excludeIds.length} soal sudah ditambahkan)</p>
								)}
							</div>
						) : (
							<div className="space-y-2">
								{questions.map((question) => {
									const isAttached = excludeIds.includes(question.id) || addedIds.includes(question.id);
									return (
										<Item
											key={question.id}
											variant="outline"
											selected={isAttached}
											className={cn(
												"flex-nowrap items-start gap-3 rounded-lg p-3 text-left",
												isAttached ? "opacity-60" : "hover:bg-muted/50 hover:border-primary/40",
											)}
										>
											<button
												type="button"
												disabled={isAttached || addMutation.isPending}
												onClick={() => handleAttach(question.id)}
												aria-label={
													isAttached ? `Soal #${question.id} sudah ada di konten ini` : `Tambah soal #${question.id}`
												}
												className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-default"
											>
												<div className="min-w-0 flex-1 space-y-1">
													<div className="prose prose-sm line-clamp-2 min-w-0 text-sm [&_*]:!m-0 [&_p]:line-clamp-2">
														<TiptapRenderer content={question.content} />
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
												{isAttached && <CheckCircleIcon className="size-4 shrink-0 text-green-800" weight="fill" />}
											</button>
										</Item>
									);
								})}
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
