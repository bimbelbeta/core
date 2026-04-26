import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
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
	AdminPageTitle,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extractTextFromTiptap, truncateText } from "@/lib/content-text";
import { orpc } from "@/utils/orpc";
import { useQuestionsSearch } from "./-hooks/use-questions-search";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"type?": "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
	"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
	"tag?": "string",
});

export const Route = createFileRoute("/admin/questions/")({
	staticData: { breadcrumb: "Soal" },
	component: QuestionsListPage,
	validateSearch: searchSchema,
});

const QUESTION_TYPE_LABELS: Record<string, string> = {
	multiple_choice: "Pilihan Ganda",
	multiple_choice_complex: "Pilihan Ganda Kompleks",
	essay: "Esai",
};

const QUESTION_TYPE_BADGE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
	multiple_choice: "default",
	multiple_choice_complex: "secondary",
	essay: "outline",
};

function QuestionsListPage() {
	const { searchParams, handleSearch, handleTypeChange, handleCategoryChange, handleNext, handlePrevious } =
		useQuestionsSearch();
	const { after, before, limit, search, questionType, category, tag } = searchParams;

	const [searchInput, setSearchInput] = useState(search ?? "");
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

	const { data, isLoading, refetch } = useQuery(
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
				setSelectedIds((prev) => prev.filter((id) => id !== deleteDialogOpen));
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const onSearch = (value: string) => {
		setSearchInput(value);
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
		setSelectedIds([]);
		refetch();
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === (data?.items.length ?? 0)) {
			setSelectedIds([]);
		} else {
			setSelectedIds(data?.items.map((q) => q.id) ?? []);
		}
	};

	const toggleSelectOne = (id: number) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
	};

	const allSelected = selectedIds.length === (data?.items.length ?? 0) && (data?.items.length ?? 0) > 0;
	const someSelected = selectedIds.length > 0 && selectedIds.length < (data?.items.length ?? 0);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>Question Bank</AdminPageTitle>
					<p className="text-muted-foreground text-sm">Kelola soal-soal untuk tryout dan ujian</p>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button asChild>
						<Link to="/admin/questions/create">
							<PlusIcon className="mr-2 size-4" />
							Buat Soal
						</Link>
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar searchValue={searchInput} onSearchChange={onSearch} searchPlaceholder="Cari soal...">
					<Select value={questionType ?? "all"} onValueChange={handleTypeChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua Tipe" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Tipe</SelectItem>
							<SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
							<SelectItem value="multiple_choice_complex">Pilihan Ganda Kompleks</SelectItem>
							<SelectItem value="essay">Esai</SelectItem>
						</SelectContent>
					</Select>
					<Select value={category ?? "all"} onValueChange={handleCategoryChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua Kategori" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Kategori</SelectItem>
							<SelectItem value="sd">SD</SelectItem>
							<SelectItem value="smp">SMP</SelectItem>
							<SelectItem value="sma">SMA</SelectItem>
							<SelectItem value="utbk">UTBK</SelectItem>
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				{selectedIds.length > 0 && (
					<AdminTableBulkActions selectedCount={selectedIds.length}>
						<AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="sm">
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
									<AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
										Hapus
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</AdminTableBulkActions>
				)}

				<AdminTableRoot className="mt-3">
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead className="w-12">
								<Checkbox
									checked={someSelected ? "indeterminate" : allSelected}
									onCheckedChange={toggleSelectAll}
									aria-label="Select all"
								/>
							</AdminTableHead>
							<AdminTableHead className="w-16 text-center">ID</AdminTableHead>
							<AdminTableHead>Konten Soal</AdminTableHead>
							<AdminTableHead className="w-32">Tipe</AdminTableHead>
							<AdminTableHead>Tags</AdminTableHead>
							<AdminTableHead className="w-24 text-right">Aksi</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							emptyMessage="Tidak ada soal ditemukan. Coba ubah filter atau buat soal baru."
							columns={6}
						>
							{data?.items.map((q) => {
								const contentPreview = truncateText(extractTextFromTiptap(q.content));
								return (
									<AdminTableRow key={q.id}>
										<AdminTableCell>
											<Checkbox
												checked={selectedIds.includes(q.id)}
												onCheckedChange={() => toggleSelectOne(q.id)}
												aria-label={`Select question ${q.id}`}
											/>
										</AdminTableCell>
										<AdminTableCell className="text-center font-mono text-muted-foreground text-sm">
											#{q.id}
										</AdminTableCell>
										<AdminTableCell>
											<div className="max-w-md">
												<Link
													to="/admin/questions/$questionId"
													params={{ questionId: q.id.toString() }}
													className="text-sm leading-relaxed hover:underline"
												>
													{contentPreview || "(Konten kosong)"}
												</Link>
											</div>
										</AdminTableCell>
										<AdminTableCell>
											<Badge variant={QUESTION_TYPE_BADGE_VARIANTS[q.type] ?? "outline"}>
												{QUESTION_TYPE_LABELS[q.type] ?? q.type}
											</Badge>
										</AdminTableCell>
										<AdminTableCell>
											<div className="flex max-w-32 flex-wrap gap-1">
												{q.tags?.slice(0, 3).map((t) => (
													<Badge key={t} variant="outline" className="text-xs">
														{t}
													</Badge>
												))}
												{q.tags && q.tags.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{q.tags.length - 3}
													</Badge>
												)}
												{!q.tags?.length && <span className="text-muted-foreground text-xs">-</span>}
											</div>
										</AdminTableCell>
										<AdminTableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<AlertDialog
													open={deleteDialogOpen === q.id}
													onOpenChange={(open) => setDeleteDialogOpen(open ? q.id : null)}
												>
													<AlertDialogTrigger asChild>
														<Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
															<TrashIcon className="size-4 text-red-600" />
														</Button>
													</AlertDialogTrigger>
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
																className="bg-red-600 hover:bg-red-700"
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

					{data && data.items.length > 0 && (
						<AdminTablePaginationWrapper>
							<PaginationButtons
								onPrevious={() => pageInfo?.startCursor && handlePrevious(pageInfo.startCursor)}
								onNext={() => pageInfo?.endCursor && handleNext(pageInfo.endCursor)}
								hasPrevious={!!pageInfo?.hasPreviousPage}
								hasNext={!!pageInfo?.hasNextPage}
							/>
						</AdminTablePaginationWrapper>
					)}
				</AdminTableRoot>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
