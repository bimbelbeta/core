import { CheckCircleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/lib/orpc";
import { QUESTION_TYPE_BADGE, QUESTION_TYPE_LABELS } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function AttachQuestionsDialog({
	open,
	onOpenChange,
	onSuccess,
	subtestId,
	attachedIds,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	subtestId: number;
	attachedIds: number[];
}) {
	const [search, setSearch] = useState("");
	const [addedIds, setAddedIds] = useState<number[]>([]);
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

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || isFetchingNextPage || !hasNextPage) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
			fetchNextPage();
		}
	}, [isFetchingNextPage, hasNextPage, fetchNextPage]);

	const attachMutation = useMutation(
		orpc.admin.tryout.questionsBulk.bulkAddQuestionsToSubtest.mutationOptions({
			onSuccess: (result, variables) => {
				toast.success(`${result.addedCount} soal ditambahkan ke subtest`);
				setAddedIds((prev) => [...prev, ...variables.questionIds]);
				onSuccess();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleAttach = (questionId: number) => {
		if (attachMutation.isPending) return;
		attachMutation.mutate({ subtestId, questionIds: [questionId] });
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setSearch("");
			setAddedIds([]);
		}
		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
				<DialogHeader className="shrink-0">
					<DialogTitle>Tambah soal</DialogTitle>
					<DialogDescription>
						Klik soal untuk langsung menambahkannya ke subtest. Dialog tetap terbuka agar soal berikutnya bisa
						ditambahkan.
					</DialogDescription>
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
									const isAttached = attachedIds.includes(question.id) || addedIds.includes(question.id);
									return (
										<Item
											key={question.id}
											variant="outline"
											selected={isAttached}
											className={cn(
												"flex-col items-stretch gap-3 p-3 text-left text-base",
												isAttached ? "opacity-60" : "hover:bg-muted/50 hover:border-primary/40 cursor-pointer",
											)}
										>
											<button
												type="button"
												disabled={isAttached || attachMutation.isPending}
												onClick={() => handleAttach(question.id)}
												aria-label={
													isAttached ? `Soal #${question.id} sudah ada di subtest` : `Tambah soal #${question.id}`
												}
												className="flex flex-col items-stretch gap-3 text-left disabled:cursor-default"
											>
												<div className="flex items-center gap-2">
													<Badge variant={QUESTION_TYPE_BADGE[question.type]}>
														{QUESTION_TYPE_LABELS[question.type]}
													</Badge>
													<span className="text-muted-foreground text-meta font-mono">#{question.id}</span>
													{isAttached && (
														<Badge variant="success" className="ml-auto gap-1">
															<CheckCircleIcon className="size-3" weight="fill" />
															Ditambahkan
														</Badge>
													)}
												</div>
												<TiptapRenderer content={question.content} className="prose-sm line-clamp-2 max-w-none" />
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
