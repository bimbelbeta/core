import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { DotsThreeIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import {
	AdminTableBulkActions,
	AdminTablePaginationWrapper,
	AdminTableToolbar,
} from "@/components/admin/admin-table-toolbar";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { extractTextFromTiptap } from "@/lib/content-text";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import {
	QUESTION_TYPE_LABELS,
	questionTypeSchema,
	SUBJECT_CATEGORY_LABELS,
	subjectCategorySchema,
} from "@/lib/schemas";
import { useQuestionsSearch } from "./-hooks/use-questions-search";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"type?": questionTypeSchema,
	"category?": subjectCategorySchema,
	"tag?": "string",
});

export const Route = createFileRoute("/admin/questions/")({
	staticData: { breadcrumb: "Bank soal" },
	component: QuestionsListPage,
	validateSearch: searchSchema,
});

const QUESTION_TYPE_SHORT_LABELS: Record<string, string> = {
	multiple_choice: "Pilihan ganda",
	multiple_choice_complex: "PG kompleks",
	essay: "Esai",
};

function QuestionsListPage() {
	const {
		searchParams,
		handleSearch,
		handleTypeChange,
		handleCategoryChange,
		handleNext,
		handlePrevious,
		handleReset,
	} = useQuestionsSearch();
	const { after, before, limit, search, questionType, category, tag } = searchParams;
	const hasFilters = Boolean(search || questionType || category || tag);

	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

	const { data, isLoading, isError, refetch } = useQuery(
		orpc.admin.tryout.questions.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				type: questionType,
				category,
				tag,
			},
		}),
	);

	const pageInfo = data?.pageInfo;

	const deleteMutation = useMutation(
		orpc.admin.tryout.questions.remove.mutationOptions({
			onSuccess: () => {
				toast.success("Soal berhasil dihapus");
				setDeleteDialogOpen(null);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const onSearch = (value: string) => {
		handleSearch(value);
	};

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	const handleBulkDelete = async () => {
		const results = await Promise.allSettled(selectedIds.map((id) => deleteMutation.mutateAsync({ id })));

		const successCount = results.filter((r) => r.status === "fulfilled").length;
		const errorCount = results.filter((r) => r.status === "rejected").length;

		if (successCount > 0) toast.success(`${successCount} soal berhasil dihapus`);
		if (errorCount > 0) toast.error(`${errorCount} soal gagal dihapus`);

		setBulkDeleteDialogOpen(false);
		clearSelection();
		refetch();
	};

	const { selectedIds, toggleSelectAll, toggleSelectOne, clearSelection, allSelected, someSelected } = useBulkSelection(
		data?.items,
	);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Bank soal</Typography>
					{pageInfo?.totalCount !== undefined && (
						<Typography variant="body" tone="muted">
							{pageInfo.totalCount} soal
						</Typography>
					)}
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button asChild size="sm" className="h-9">
						<Link to="/admin/questions/create">
							<PlusIcon className="size-4" />
							Tambah soal
						</Link>
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				{selectedIds.length === 0 && (
					<AdminTableToolbar
						searchValue={search ?? ""}
						onSearchChange={onSearch}
						searchPlaceholder="Cari soal..."
						onReset={
							hasFilters
								? () => {
										handleReset();
									}
								: undefined
						}
					>
						<Select value={questionType ?? "all"} onValueChange={handleTypeChange}>
							<SelectTrigger className="w-full sm:w-40">
								<SelectValue placeholder="Semua Tipe" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Tipe</SelectItem>
								<SelectItem value="multiple_choice">{QUESTION_TYPE_LABELS.multiple_choice}</SelectItem>
								<SelectItem value="multiple_choice_complex">{QUESTION_TYPE_LABELS.multiple_choice_complex}</SelectItem>
								<SelectItem value="essay">{QUESTION_TYPE_LABELS.essay}</SelectItem>
							</SelectContent>
						</Select>
						<Select value={category ?? "all"} onValueChange={handleCategoryChange}>
							<SelectTrigger className="w-full sm:w-40">
								<SelectValue placeholder="Semua Kategori" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Kategori</SelectItem>
								{Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</AdminTableToolbar>
				)}

				<AdminTableBulkActions selectedCount={selectedIds.length}>
					<AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="xs">
								<TrashIcon className="mr-2 size-4" />
								Hapus Terpilih
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Hapus Multiple Soal</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah Anda yakin ingin menghapus {selectedIds.length} soal yang dipilih? Tindakan ini tidak dapat
									dibatalkan.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction onClick={handleBulkDelete} variant="destructive">
									Hapus
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</AdminTableBulkActions>

				<AdminTableRoot>
					<AdminTable className="table-fixed">
						<AdminTableHeader>
							<AdminTableHead className="hidden w-12 px-4 sm:table-cell">
								<Checkbox
									checked={someSelected ? "indeterminate" : allSelected}
									onCheckedChange={toggleSelectAll}
									aria-label="Pilih semua soal"
								/>
							</AdminTableHead>
							<AdminTableHead>Soal</AdminTableHead>
							<AdminTableHead className="hidden w-28 sm:table-cell">Dibuat</AdminTableHead>
							<AdminTableHead className="w-16 text-right">
								<span className="sr-only">Aksi</span>
							</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isError={isError}
							onRetry={() => refetch()}
							isEmpty={!isLoading && !isError && data?.items.length === 0}
							emptyMessage={hasFilters ? "Tidak ada soal yang cocok dengan filter ini." : "Bank soal masih kosong."}
							emptyAction={
								hasFilters ? (
									<Button variant="outline" size="sm" onClick={handleReset}>
										Hapus filter
									</Button>
								) : (
									<Button asChild size="sm">
										<Link to="/admin/questions/create">
											<PlusIcon className="size-4" />
											Tambah soal
										</Link>
									</Button>
								)
							}
							columns={4}
						>
							{data?.items.map((q) => {
								const contentPreview = extractTextFromTiptap(q.content);
								return (
									<AdminTableRow key={q.id}>
										<AdminTableCell className="hidden sm:table-cell">
											<Checkbox
												checked={selectedIds.includes(q.id)}
												onCheckedChange={() => toggleSelectOne(q.id)}
												aria-label={`Pilih soal #${q.id}`}
											/>
										</AdminTableCell>
										<AdminTableCell>
											<div className="min-w-0">
												<Link
													to="/admin/questions/$questionId"
													params={{ questionId: q.id.toString() }}
													className="text-row-title text-foreground hover:text-primary focus-visible:text-primary focus-visible:ring-ring/50 line-clamp-2 rounded-sm whitespace-normal underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline focus-visible:ring-2"
												>
													{contentPreview || "(Konten kosong)"}
												</Link>
												<div className="text-muted-foreground text-meta mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
													<span className="font-mono">#{q.id}</span>
													<span aria-hidden>·</span>
													<span>{QUESTION_TYPE_SHORT_LABELS[q.type] ?? q.type}</span>
													{q.tags?.slice(0, 3).map((t) => (
														<Badge key={t} variant="outline" className="text-meta font-normal">
															{t}
														</Badge>
													))}
													{q.tags && q.tags.length > 3 && (
														<Badge variant="outline" className="text-meta font-normal">
															+{q.tags.length - 3}
														</Badge>
													)}
												</div>
											</div>
										</AdminTableCell>
										<AdminTableCell className="text-muted-foreground text-meta hidden whitespace-nowrap sm:table-cell">
											{q.createdAt ? formatDateMedium(new Date(q.createdAt)) : "—"}
										</AdminTableCell>
										<AdminTableCell className="relative z-10 text-right align-top">
											<div className="flex items-center justify-end gap-2">
												<AlertDialog
													open={deleteDialogOpen === q.id}
													onOpenChange={(open) => setDeleteDialogOpen(open ? q.id : null)}
												>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="m-1.5 p-2.5"
																aria-label={`Aksi untuk soal ${q.id}`}
															>
																<DotsThreeIcon className="size-5" weight="bold" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem asChild>
																<Link to="/admin/questions/$questionId" params={{ questionId: q.id.toString() }}>
																	Buka soal
																</Link>
															</DropdownMenuItem>
															<DropdownMenuItem variant="destructive" onSelect={() => setDeleteDialogOpen(q.id)}>
																<TrashIcon className="size-4" /> Hapus soal
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
													<AlertDialogContent onClick={(e) => e.stopPropagation()}>
														<AlertDialogHeader>
															<AlertDialogTitle>Hapus Soal</AlertDialogTitle>
															<AlertDialogDescription>
																Apakah Anda yakin ingin menghapus soal #{q.id}? Tindakan ini tidak dapat dibatalkan.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Batal</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDelete(q.id)}
																className={buttonVariants({ variant: "destructive" })}
															>
																Hapus
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</AdminTableCell>
									</AdminTableRow>
								);
							})}
						</AdminTableBody>
					</AdminTable>

					{data && (pageInfo?.hasPreviousPage || pageInfo?.hasNextPage) && (
						<AdminTablePaginationWrapper>
							<PaginationButtons
								onPrevious={() => pageInfo?.startCursor && handlePrevious(pageInfo.startCursor)}
								onNext={() => pageInfo?.endCursor && handleNext(pageInfo.endCursor)}
								hasPrevious={!!pageInfo?.hasPreviousPage}
								hasNext={!!pageInfo?.hasNextPage}
								totalCount={pageInfo?.totalCount}
							/>
						</AdminTablePaginationWrapper>
					)}
				</AdminTableRoot>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
