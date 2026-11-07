import { DotsThreeIcon, TrashIcon } from "@phosphor-icons/react";
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
import { TryoutStatus } from "@/components/admin/tryout-status";
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
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { formatDateMedium } from "@/lib/format-date";
import { SUBJECT_CATEGORY_LABELS, TRYOUT_STATUS_BADGE, tryoutStatusSchema } from "@/lib/schemas";
import { useTryoutsList } from "../-hooks/use-tryouts-list";
import { AddTryoutDialog } from "./add-tryout-dialog";

export function TryoutsListPage() {
	const {
		category,
		status,
		sort,
		searchInput,
		isAddDialogOpen,
		setIsAddDialogOpen,
		deleteDialogOpen,
		setDeleteDialogOpen,
		data,
		isLoading,
		isError,
		refetch,
		pageInfo,
		handleSearch,
		handleCategoryChange,
		handleStatusChange,
		handleSortChange,
		handleReset,
		handleNext,
		handlePrevious,
		handleDelete,
	} = useTryoutsList();

	const hasFilters = Boolean(searchInput || category || status);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Tryout</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<AddTryoutDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={() => refetch()} />
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={searchInput}
					onSearchChange={handleSearch}
					searchPlaceholder="Cari tryout..."
					onReset={hasFilters ? handleReset : undefined}
					trailing={
						<Select value={sort ?? "terbaru"} onValueChange={handleSortChange}>
							<SelectTrigger className="w-full sm:w-44" aria-label="Urutkan tryout">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="terbaru">Terbaru</SelectItem>
								<SelectItem value="terlama">Terlama</SelectItem>
							</SelectContent>
						</Select>
					}
				>
					<Select value={category ?? "all"} onValueChange={handleCategoryChange}>
						<SelectTrigger className="w-full sm:w-44">
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
					<Select value={status ?? "all"} onValueChange={handleStatusChange}>
						<SelectTrigger className="w-full sm:w-44">
							<SelectValue placeholder="Semua status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua status</SelectItem>
							{Object.entries(TRYOUT_STATUS_BADGE).map(([value]) => (
								<SelectItem key={value} value={value}>
									<TryoutStatus status={tryoutStatusSchema.assert(value)} />
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot>
					<AdminTable className="table-fixed">
						<AdminTableHeader>
							<AdminTableHead className="w-[36%] pl-3">Tryout</AdminTableHead>
							<AdminTableHead className="w-[16%]">Status</AdminTableHead>
							<AdminTableHead className="hidden w-[42%] text-right sm:table-cell">Diperbarui</AdminTableHead>
							<AdminTableHead className="w-[6%] pr-3 text-right">
								<span className="sr-only">Aksi</span>
							</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isError={isError}
							onRetry={() => refetch()}
							isEmpty={!isLoading && !isError && data?.items.length === 0}
							emptyMessage={hasFilters ? "Tidak ada tryout yang cocok dengan filter ini." : "Belum ada tryout."}
							emptyAction={
								hasFilters ? (
									<Button variant="outline" size="xs" onClick={handleReset}>
										Hapus filter
									</Button>
								) : (
									<Button size="xs" onClick={() => setIsAddDialogOpen(true)}>
										Tambah tryout
									</Button>
								)
							}
							columns={4}
						>
							{data?.items.map((tryout) => (
								<AdminTableRow key={tryout.id}>
									<AdminTableCell className="pl-3">
										<div className="min-w-0">
											<Link
												to="/admin/tryouts/$tryoutId"
												params={{ tryoutId: tryout.id.toString() }}
												className="text-row-title text-foreground hover:text-primary focus-visible:ring-ring/50 block truncate rounded-sm underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:ring-2"
											>
												{tryout.title}
											</Link>
											<p className="text-muted-foreground text-meta mt-0.5 flex flex-wrap items-center gap-x-1.5">
												<span>{SUBJECT_CATEGORY_LABELS[tryout.category]}</span>
												<span>· {tryout.subtestCount} subtest</span>
												<span>· {tryout.attemptCount} percobaan</span>
											</p>
										</div>
									</AdminTableCell>
									<AdminTableCell>
										<TryoutStatus status={tryout.status} />
									</AdminTableCell>
									<AdminTableCell className="text-muted-foreground text-meta hidden text-right whitespace-nowrap sm:table-cell">
										{tryout.updatedAt ? formatDateMedium(new Date(tryout.updatedAt)) : "—"}
									</AdminTableCell>
									<AdminTableCell className="relative z-10 pr-3 text-right">
										<div className="flex items-center justify-end gap-2">
											<AlertDialog
												open={deleteDialogOpen === tryout.id}
												onOpenChange={(open) => setDeleteDialogOpen(open ? tryout.id : null)}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon-xs" aria-label={`Aksi untuk ${tryout.title}`}>
															<DotsThreeIcon className="size-4" weight="bold" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link to="/admin/tryouts/$tryoutId" params={{ tryoutId: tryout.id.toString() }}>
																Buka tryout
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem variant="destructive" onSelect={() => setDeleteDialogOpen(tryout.id)}>
															<TrashIcon className="size-4" /> Hapus tryout
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
												<AlertDialogContent onClick={(e) => e.stopPropagation()}>
													<AlertDialogHeader>
														<AlertDialogTitle className="text-base">Hapus Tryout</AlertDialogTitle>
														<AlertDialogDescription>
															Apakah Anda yakin ingin menghapus tryout &quot;{tryout.title}&quot;? Tindakan ini tidak
															dapat dibatalkan.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel size="xs">Batal</AlertDialogCancel>
														<AlertDialogAction size="xs" onClick={() => handleDelete(tryout.id)} variant="destructive">
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

					{data && pageInfo?.totalCount !== undefined && (
						<AdminTablePaginationWrapper>
							<PaginationButtons
								onPrevious={handlePrevious}
								onNext={handleNext}
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
