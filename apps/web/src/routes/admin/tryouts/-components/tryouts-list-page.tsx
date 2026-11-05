import { TrashIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { SUBJECT_CATEGORY_LABELS, TRYOUT_STATUS_BADGE } from "@/lib/schemas";
import { useTryoutsList } from "../-hooks/use-tryouts-list";
import { AddTryoutDialog } from "./add-tryout-dialog";

export function TryoutsListPage() {
	const {
		category,
		status,
		searchInput,
		isAddDialogOpen,
		setIsAddDialogOpen,
		deleteDialogOpen,
		setDeleteDialogOpen,
		data,
		isLoading,
		refetch,
		pageInfo,
		handleSearch,
		handleCategoryChange,
		handleStatusChange,
		handleNext,
		handlePrevious,
		handleDelete,
	} = useTryoutsList();

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Tryout Management</Typography>
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
							{Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={status ?? "all"} onValueChange={handleStatusChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Status</SelectItem>
							{Object.entries(TRYOUT_STATUS_BADGE).map(([value, status]) => (
								<SelectItem key={value} value={value}>
									{status.label}
								</SelectItem>
							))}
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
									<AdminTableCell className="text-muted-foreground text-center font-mono text-sm">
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
										<Badge variant="outline">{SUBJECT_CATEGORY_LABELS[tryout.category]}</Badge>
									</AdminTableCell>
									<AdminTableCell>
										<Badge variant={TRYOUT_STATUS_BADGE[tryout.status].variant}>
											{TRYOUT_STATUS_BADGE[tryout.status].label}
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
													<Button variant="ghost" size="icon">
														<TrashIcon className="size-4 text-red-600" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Hapus Tryout</AlertDialogTitle>
														<AlertDialogDescription>
															Apakah Anda yakin ingin menghapus tryout "{tryout.title}"? Tindakan ini tidak dapat
															dibatalkan.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Batal</AlertDialogCancel>
														<AlertDialogAction onClick={() => handleDelete(tryout.id)} variant="destructive">
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
