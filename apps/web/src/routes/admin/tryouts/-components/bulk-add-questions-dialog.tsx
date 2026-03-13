import { CheckCircleIcon, MagnifyingGlassIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
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
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
		orpc.admin.tryout.questions.list.infiniteOptions({
			input: (pageParam) => ({
				cursor: pageParam,
				limit: 20,
				search: search || undefined,
			}),
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
			initialPageParam: undefined as number | undefined,
		}),
	);

	const questions = data?.pages.flatMap((page) => page.questions) ?? [];

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || isFetchingNextPage || !hasNextPage) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
			fetchNextPage();
		}
	}, [isFetchingNextPage, hasNextPage, fetchNextPage]);

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
		if (questions.length > 0 && selectedQuestionIds.size === questions.length) {
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
			bulkAddMutation.mutate({
				subtestId,
				questionIds: Array.from(selectedQuestionIds),
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
				<DialogHeader className="shrink-0">
					<DialogTitle>Tambah Soal Massal</DialogTitle>
					<DialogDescription>Pilih soal dari bank soal untuk ditambahkan ke subtest.</DialogDescription>
				</DialogHeader>
				<div className="flex flex-1 flex-col gap-4">
					<InputGroup className="min-h-10 bg-white">
						<InputGroupAddon>
							<MagnifyingGlassIcon />
						</InputGroupAddon>
						<InputGroupInput
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Ketik untuk mencari soal..."
						/>
					</InputGroup>

					<div ref={scrollRef} onScroll={handleScroll} className="max-h-[calc(85vh-14rem)] flex-1 overflow-y-auto">
						{isPending ? (
							<div className="flex items-center justify-center py-8 text-muted-foreground">
								<Spinner />
							</div>
						) : questions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
								Tidak ada soal ditemukan
							</div>
						) : (
							<div className="space-y-2 overflow-visible">
								{questions.map((question) => {
									const isSelected = selectedQuestionIds.has(question.id);
									return (
										<label
											key={question.id}
											className={`group relative flex cursor-pointer flex-col gap-3 rounded-lg border p-3 outline-none transition-all focus-within:ring-2 focus-within:ring-primary ${
												isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
											}`}
										>
											<input
												type="checkbox"
												className="sr-only"
												checked={isSelected}
												onChange={() => handleQuestionToggle(question.id)}
											/>
											{isSelected && (
												<div className="absolute top-3 right-3 text-primary">
													<CheckCircleIcon size={20} weight="fill" />
												</div>
											)}
											<Badge variant={question.type === "multiple_choice" ? "default" : "outline"} className="w-fit">
												{question.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
											</Badge>
											<div className="pr-8">
												<TiptapRenderer content={question.content} />
											</div>
										</label>
									);
								})}
								{isFetchingNextPage && (
									<div className="flex animate-pulse items-center justify-center py-4 text-muted-foreground text-sm">
										Memuat lebih banyak soal...
									</div>
								)}
							</div>
						)}
					</div>

					<div className="flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<Button variant="tertiary" size="sm" onClick={handleSelectAll}>
								{questions.length > 0 && selectedQuestionIds.size === questions.length
									? "Batal Pilih Semua"
									: "Pilih Semua"}
							</Button>
							<span className="text-muted-foreground text-sm">({selectedQuestionIds.size} dipilih)</span>
						</div>
						<Button
							variant="default"
							onClick={handleAdd}
							disabled={selectedQuestionIds.size === 0 || bulkAddMutation.isPending}
							className="w-full sm:w-auto"
						>
							{bulkAddMutation.isPending ? (
								"Menambahkan..."
							) : (
								<>
									<PlusCircleIcon weight="fill" />
									Tambah {selectedQuestionIds.size} Soal
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
