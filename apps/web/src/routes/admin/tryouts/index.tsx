import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { TrashIcon } from "@phosphor-icons/react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";
import { AddTryoutDialog } from "./-components/add-tryout-dialog";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
	"status?": "'draft' | 'published' | 'archived'",
});

export const Route = createFileRoute("/admin/tryouts/")({
	staticData: { breadcrumb: "Tryout" },
	component: TryoutsListPage,
	validateSearch: searchSchema,
});

function TryoutsListPage() {
	const navigate = Route.useNavigate();
	const { after, before, limit = 10, search, category, status } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.tryout.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				category,
				status,
			},
		}),
	);

	const pageInfo = data?.pageInfo;

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

	const deleteMutation = useMutation(
		orpc.admin.tryout.remove.mutationOptions({
			onSuccess: () => {
				toast.success("Tryout berhasil dihapus");
				setDeleteDialogOpen(null);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const baseSearchParams = {
		...(search && { search }),
		...(category && { category }),
		...(status && { status }),
		limit,
	};

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: {
				...(value && { search: value }),
				...(category && { category }),
				...(status && { status }),
				limit,
			},
		});
	};

	const handleCategoryChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(value !== "all" && { category: value as "sd" | "smp" | "sma" | "utbk" }),
				...(status && { status }),
				limit,
			},
		});
	};

	const handleStatusChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(category && { category }),
				...(value !== "all" && { status: value as "draft" | "published" | "archived" }),
				limit,
			},
		});
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>Tryout Management</AdminPageTitle>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<AddTryoutDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={() => refetch()} />
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar searchValue={searchInput} onSearchChange={handleSearch} searchPlaceholder="Cari tryout...">
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
					<Select value={status ?? "all"} onValueChange={handleStatusChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Status</SelectItem>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="published">Published</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot className="mt-3">
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead className="w-12.5 text-center">No</AdminTableHead>
							<AdminTableHead>Judul</AdminTableHead>
							<AdminTableHead>Kategori</AdminTableHead>
							<AdminTableHead>Status</AdminTableHead>
							<AdminTableHead>Dibuat</AdminTableHead>
							<AdminTableHead className="text-right">Aksi</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							emptyMessage="Tidak ada tryout ditemukan."
							columns={6}
						>
							{data?.items.map((tryout, index) => (
								<AdminTableRow key={tryout.id}>
									<AdminTableCell className="text-center font-mono text-muted-foreground text-sm">
										{index + 1}
									</AdminTableCell>
									<AdminTableCell className="font-medium">
										<Link
											to="/admin/tryouts/$tryoutId"
											params={{ tryoutId: tryout.id.toString() }}
											className="hover:underline"
										>
											{tryout.title}
										</Link>
									</AdminTableCell>
									<AdminTableCell>
										<Badge variant="outline">{tryout.category.toUpperCase()}</Badge>
									</AdminTableCell>
									<AdminTableCell>
										<Badge
											variant={
												tryout.status === "published"
													? "default"
													: tryout.status === "archived"
														? "secondary"
														: "outline"
											}
										>
											{tryout.status.toUpperCase()}
										</Badge>
									</AdminTableCell>
									<AdminTableCell>
										{tryout.createdAt ? new Date(tryout.createdAt).toLocaleDateString("id-ID") : "-"}
									</AdminTableCell>
									<AdminTableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<AlertDialog
												open={deleteDialogOpen === tryout.id}
												onOpenChange={(open) => setDeleteDialogOpen(open ? tryout.id : null)}
											>
												<AlertDialogTrigger asChild>
													<Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
														<TrashIcon className="size-4 text-red-600" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent onClick={(e) => e.stopPropagation()}>
													<AlertDialogHeader>
														<AlertDialogTitle>Hapus Tryout</AlertDialogTitle>
														<AlertDialogDescription>
															Apakah Anda yakin ingin menghapus tryout "{tryout.title}"? Tindakan ini tidak dapat
															dibatalkan.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Batal</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleDelete(tryout.id)}
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
							))}
						</AdminTableBody>
					</AdminTable>

					{data && (
						<AdminTablePaginationWrapper>
							<PaginationButtons
								onPrevious={handlePrevious}
								onNext={handleNext}
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
