import { CheckCircleIcon, DotsThreeIcon, ProhibitIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { AdminStatus } from "@/components/admin/admin-status";
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
		status,
		handleNext,
		handlePrevious,
		handleReset,
		handleSearch,
		handleStatusChange,
		handleToggleStatus,
	} = useReferralsList();

	const hasFilters = Boolean(search || status !== undefined);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Kode referral</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<CreateReferralDialog onSuccess={() => refetch()} />
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={search ?? ""}
					onSearchChange={handleSearch}
					searchPlaceholder="Cari kode referral..."
					onReset={hasFilters ? handleReset : undefined}
				>
					<Select value={status === undefined ? "all" : status ? "true" : "false"} onValueChange={handleStatusChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua status</SelectItem>
							<SelectItem value="true">Aktif</SelectItem>
							<SelectItem value="false">Nonaktif</SelectItem>
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot>
					<AdminTable className="table-fixed">
						<AdminTableHeader>
							<AdminTableHead className="w-[36%] pl-3">Kode</AdminTableHead>
							<AdminTableHead className="w-[14%]">Status</AdminTableHead>
							<AdminTableHead className="w-[14%] text-right">Penggunaan</AdminTableHead>
							<AdminTableHead className="hidden w-[11%] text-right sm:table-cell">Durasi</AdminTableHead>
							<AdminTableHead className="hidden w-[19%] text-right sm:table-cell">Diperbarui</AdminTableHead>
							<AdminTableHead className="w-[6%] pr-3 text-right">
								<span className="sr-only">Aksi</span>
							</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							emptyMessage={search ? "Tidak ada kode yang cocok dengan pencarian ini." : "Belum ada kode referal."}
							emptyAction={
								search ? (
									<Button variant="outline" size="sm" onClick={handleReset}>
										Hapus filter
									</Button>
								) : undefined
							}
							columns={6}
						>
							{data?.items.map((item) => {
								const isExpired = item.validUntil ? new Date(item.validUntil) < new Date() : false;
								const isFull = item.maxUsages !== null && item.usageCount >= item.maxUsages;
								return (
									<AdminTableRow key={item.id}>
										<AdminTableCell className="pl-3">
											<div className="min-w-0">
												<Link
													to="/admin/referrals/$codeId"
													params={{ codeId: item.id }}
													className="text-row-title text-foreground hover:text-primary focus-visible:ring-ring/50 block rounded-sm font-mono tracking-wide underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:ring-2"
												>
													{item.code}
												</Link>
												<p className="text-muted-foreground text-meta mt-0.5 truncate">
													{item.validUntil ? `Berlaku hingga ${formatDate(item.validUntil)}` : "Tanpa batas waktu"}
												</p>
											</div>
										</AdminTableCell>
										<AdminTableCell>
											{item.status && !isExpired && !isFull ? (
												<AdminStatus tone="positive">Aktif</AdminStatus>
											) : (
												<AdminStatus tone={!item.status ? "neutral" : isExpired ? "danger" : "warning"}>
													{!item.status ? "Nonaktif" : isExpired ? "Kedaluwarsa" : "Kuota habis"}
												</AdminStatus>
											)}
										</AdminTableCell>
										<AdminTableCell className="text-right">
											<span className="text-sm tabular-nums">
												{item.usageCount}
												{item.maxUsages !== null ? ` / ${item.maxUsages}` : " / ∞"}
											</span>
										</AdminTableCell>
										<AdminTableCell className="hidden text-right sm:table-cell">
											<span className="text-sm tabular-nums">{item.premiumDays} hari</span>
										</AdminTableCell>
										<AdminTableCell className="text-muted-foreground text-meta hidden text-right whitespace-nowrap sm:table-cell">
											{formatDateMedium(new Date(item.updatedAt))}
										</AdminTableCell>
										<AdminTableCell className="relative z-10 pr-3 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="size-9" aria-label={`Aksi untuk ${item.code}`}>
														<DotsThreeIcon className="size-5" weight="bold" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onSelect={() => handleToggleStatus(item.id, !item.status)}>
														{item.status ? (
															<>
																<ProhibitIcon className="size-4" /> Nonaktifkan
															</>
														) : (
															<>
																<CheckCircleIcon className="size-4" /> Aktifkan
															</>
														)}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
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
								totalCount={pageInfo?.totalCount}
							/>
						</AdminTablePaginationWrapper>
					)}
				</AdminTableRoot>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
