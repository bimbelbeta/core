import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { DotsThreeIcon, TrashIcon } from "@phosphor-icons/react";
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
import { AdminTablePaginationWrapper, AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableRowStack, tableRowLinkClass } from "@/components/ui/table-row-stack";
import { Typography } from "@/components/ui/typography";
import { extractTextFromTiptap } from "@/lib/content-text";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import {
	QUESTION_TYPE_LABELS,
	QUESTION_TYPE_SHORT_LABELS,
	questionTypeSchema,
	SUBJECT_CATEGORY_LABELS,
	subjectCategorySchema,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
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

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Bank soal</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button asChild size="xs">
						<Link to="/admin/questions/create">Tambah soal</Link>
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
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
							<SelectValue placeholder="Semua tipe" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua tipe</SelectItem>
							<SelectItem value="multiple_choice">{QUESTION_TYPE_LABELS.multiple_choice}</SelectItem>
							<SelectItem value="multiple_choice_complex">{QUESTION_TYPE_LABELS.multiple_choice_complex}</SelectItem>
							<SelectItem value="essay">{QUESTION_TYPE_LABELS.essay}</SelectItem>
						</SelectContent>
					</Select>
					<Select value={category ?? "all"} onValueChange={handleCategoryChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua kategori" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua kategori</SelectItem>
							{Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot>
					<AdminTable className="table-fixed">
						<AdminTableHeader>
							<AdminTableHead className="pl-3">Soal</AdminTableHead>
							<AdminTableHead className="hidden w-32 text-right sm:table-cell">Dibuat</AdminTableHead>
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
									<Button variant="outline" size="xs" onClick={handleReset}>
										Hapus filter
									</Button>
								) : (
									<Button asChild size="xs">
										<Link to="/admin/questions/create">Tambah soal</Link>
									</Button>
								)
							}
							columns={3}
						>
							{data?.items.map((q) => {
								const contentPreview = extractTextFromTiptap(q.content);
								return (
									<AdminTableRow key={q.id}>
										<AdminTableCell className="pl-3">
											<TableRowStack
												title={
													<Link
														to="/admin/questions/$questionId"
														params={{ questionId: q.id.toString() }}
														className={cn(tableRowLinkClass, "line-clamp-2")}
													>
														{contentPreview || "(Konten kosong)"}
													</Link>
												}
												subtitle={
													<>
														<span className="font-mono">#{q.id}</span>
														<span aria-hidden>·</span>
														<span>{QUESTION_TYPE_SHORT_LABELS[q.type] ?? q.type}</span>
														{q.tags?.map((t) => (
															<Badge key={t} variant="outline" className="text-meta font-normal">
																{t}
															</Badge>
														))}
													</>
												}
											/>
										</AdminTableCell>
										<AdminTableCell className="text-muted-foreground text-meta hidden text-right whitespace-nowrap sm:table-cell">
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
															<Button variant="ghost" size="icon-xs" aria-label={`Aksi untuk soal ${q.id}`}>
																<DotsThreeIcon className="size-4" weight="bold" />
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
															<AlertDialogTitle className="text-base">Hapus Soal</AlertDialogTitle>
															<AlertDialogDescription>
																Apakah Anda yakin ingin menghapus soal #{q.id}? Tindakan ini tidak dapat dibatalkan.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel size="xs">Batal</AlertDialogCancel>
															<AlertDialogAction size="xs" variant="destructive" onClick={() => handleDelete(q.id)}>
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

					{data && pageInfo?.totalCount !== undefined && (
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
