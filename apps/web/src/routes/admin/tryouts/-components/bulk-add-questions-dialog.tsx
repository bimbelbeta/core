import { MagnifyingGlassIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxIndicator } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { orpc } from "@/lib/orpc";
import { QUESTION_TYPE_LABELS } from "@/lib/schemas";

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
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
		orpc.admin.tryout.questions.list.infiniteOptions({
			input: (pageParam) => ({
				after: pageParam,
				limit: 20,
				search: search || undefined,
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

	const bulkAddMutation = useMutation(
		orpc.admin.tryout.questionsBulk.bulkAddQuestionsToSubtest.mutationOptions({
			onSuccess: (result) => {
				toast.success(`${result.addedCount} soal berhasil ditambahkan`);
				clearSelection();
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
			bulkAddMutation.mutate({
				subtestId,
				questionIds: selectedQuestionIds,
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
							<div className="text-muted-foreground flex items-center justify-center py-8">
								<Spinner />
							</div>
						) : questions.length === 0 ? (
							<div className="text-muted-foreground flex flex-col items-center justify-center py-8">
								Tidak ada soal ditemukan
							</div>
						) : (
							<div className="space-y-2 overflow-visible">
								{questions.map((question) => {
									const isSelected = selectedQuestionIds.includes(question.id);
									return (
										<Item
											asChild
											key={question.id}
											selected={isSelected}
											variant="outline"
											className="hover:bg-muted/50 focus-within:ring-primary relative cursor-pointer flex-col items-stretch gap-3 p-3 text-left text-base focus-within:ring-2"
										>
											<label>
												<input
													type="checkbox"
													className="sr-only"
													aria-label={`Pilih soal #${question.id}`}
													checked={isSelected}
													onChange={() => handleQuestionToggle(question.id)}
												/>
												<div className="pointer-events-none absolute top-3 right-3">
													<CheckboxIndicator checked={isSelected} />
												</div>
												<Badge variant={question.type === "multiple_choice" ? "default" : "outline"} className="w-fit">
													{QUESTION_TYPE_LABELS[question.type]}
												</Badge>
												<div className="pr-8">
													<TiptapRenderer content={question.content} />
												</div>
											</label>
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

					<div className="flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<Button variant="tertiary" size="sm" onClick={handleSelectAll}>
								{allSelected ? "Batal Pilih Semua" : "Pilih Semua"}
							</Button>
							<span className="text-muted-foreground text-sm">({selectedQuestionIds.length} dipilih)</span>
						</div>
						<Button
							variant="default"
							onClick={handleAdd}
							disabled={selectedQuestionIds.length === 0 || bulkAddMutation.isPending}
							className="w-full sm:w-auto"
						>
							{bulkAddMutation.isPending ? (
								"Menambahkan..."
							) : (
								<>
									<PlusCircleIcon weight="fill" />
									Tambah {selectedQuestionIds.length} Soal
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
