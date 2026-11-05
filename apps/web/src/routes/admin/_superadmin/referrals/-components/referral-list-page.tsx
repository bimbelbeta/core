import { ArrowRightIcon, CheckCircleIcon, ProhibitIcon, XCircleIcon } from "@phosphor-icons/react";
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
import { Typography } from "@/components/ui/typography";
import { useReferralsList } from "../-hooks/use-referrals-list";
import { formatDate } from "../-utils";
import { CreateReferralDialog } from "./create-referral-dialog";

export function ReferralListPage() {
	const {
		data,
		isLoading,
		refetch,
		pageInfo,
		search,
		selectedIds,
		bulkDialogOpen,
		setBulkDialogOpen,
		handleNext,
		handlePrevious,
		handleSearch,
		handleToggleStatus,
		handleBulkDeactivate,
		toggleSelectAll,
		toggleSelectOne,
		allSelected,
		someSelected,
	} = useReferralsList();

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Referral Codes</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<CreateReferralDialog onSuccess={() => refetch()} />
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={search ?? ""}
					onSearchChange={handleSearch}
					searchPlaceholder="Cari kode referal..."
				/>

				{selectedIds.length > 0 && (
					<AdminTableBulkActions selectedCount={selectedIds.length}>
						<AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="sm">
									<ProhibitIcon className="mr-2 size-4" />
									Nonaktifkan Terpilih
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Nonaktifkan Kode Referal</AlertDialogTitle>
									<AlertDialogDescription>
										{selectedIds.length} kode akan dinonaktifkan. Pengguna tidak dapat lagi menukarkan kode ini.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Batal</AlertDialogCancel>
									<AlertDialogAction onClick={handleBulkDeactivate} variant="destructive">
										Nonaktifkan
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</AdminTableBulkActions>
				)}

				<AdminTableRoot className="mt-3">
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead className="w-12 pl-4">
								<Checkbox
									checked={someSelected ? "indeterminate" : allSelected}
									onCheckedChange={toggleSelectAll}
									aria-label="Pilih semua kode referal"
								/>
							</AdminTableHead>
							<AdminTableHead>Status</AdminTableHead>
							<AdminTableHead>Kode</AdminTableHead>
							<AdminTableHead>Penggunaan</AdminTableHead>
							<AdminTableHead>Berlaku Hingga</AdminTableHead>
							<AdminTableHead>Durasi Premium</AdminTableHead>
							<AdminTableHead className="pr-4 text-right">Aksi</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							emptyMessage="Belum ada kode referal."
							columns={7}
						>
							{data?.items.map((item) => {
								const isExpired = item.validUntil ? new Date(item.validUntil) < new Date() : false;
								const isFull = item.maxUsages !== null && item.usageCount >= item.maxUsages;
								return (
									<AdminTableRow key={item.id}>
										<AdminTableCell className="pl-4">
											<Checkbox
												checked={selectedIds.includes(item.id)}
												onCheckedChange={() => toggleSelectOne(item.id)}
												aria-label={`Pilih ${item.code}`}
											/>
										</AdminTableCell>
										<AdminTableCell>
											{item.status && !isExpired && !isFull ? (
												<Badge
													className="gap-1 border-green-200 bg-green-50 text-[11px] text-green-700"
													variant="outline"
												>
													<CheckCircleIcon className="size-3" weight="fill" />
													Aktif
												</Badge>
											) : (
												<Badge className="gap-1 border-red-200 bg-red-50 text-[11px] text-red-700" variant="outline">
													<XCircleIcon className="size-3" weight="fill" />
													{!item.status ? "Nonaktif" : isExpired ? "Kedaluwarsa" : "Kuota Habis"}
												</Badge>
											)}
										</AdminTableCell>
										<AdminTableCell>
											<code className="bg-muted rounded px-2 py-0.5 font-mono text-sm font-semibold tracking-wide">
												{item.code}
											</code>
										</AdminTableCell>
										<AdminTableCell>
											<span className="text-sm tabular-nums">
												{item.usageCount}
												{item.maxUsages !== null ? ` / ${item.maxUsages}` : " / ∞"}
											</span>
										</AdminTableCell>
										<AdminTableCell>
											<span className={`text-sm ${isExpired ? "text-red-600" : "text-muted-foreground"}`}>
												{formatDate(item.validUntil)}
											</span>
										</AdminTableCell>
										<AdminTableCell>
											<span className="text-sm">{item.premiumDays} hari</span>
										</AdminTableCell>
										<AdminTableCell className="pr-4 text-right">
											<div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
												<Button
													variant="ghost"
													size="icon"
													className="size-8"
													onClick={() => handleToggleStatus(item.id, !item.status)}
													title={item.status ? "Nonaktifkan" : "Aktifkan"}
													id={`toggle-status-${item.id}`}
												>
													{item.status ? (
														<ProhibitIcon className="text-destructive size-4" />
													) : (
														<CheckCircleIcon className="size-4 text-green-600" />
													)}
												</Button>
												<Button variant="ghost" size="icon" className="size-8" asChild>
													<Link to="/admin/referrals/$codeId" params={{ codeId: item.id }} aria-label="Lihat detail">
														<ArrowRightIcon className="size-4" />
													</Link>
												</Button>
											</div>
										</AdminTableCell>
									</AdminTableRow>
								);
							})}
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
