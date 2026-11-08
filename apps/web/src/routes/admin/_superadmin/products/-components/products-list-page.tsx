import { ArrowCounterClockwiseIcon, DotsThreeIcon, TrashIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { AdminChip, AdminMeta } from "@/components/admin/admin-status";
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
import { TableRowStack, tableRowLinkClass } from "@/components/ui/table-row-stack";
import { Typography } from "@/components/ui/typography";
import { formatDateMedium } from "@/lib/format-date";
import { formatRupiah } from "@/lib/formatter";
import { variantConfig } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useProductsList } from "../-hooks/use-products-list";
import { DeleteProductDialog } from "./delete-product-dialog";
import { RestoreProductDialog } from "./restore-product-dialog";

export function ProductsListPage() {
	const {
		data,
		isLoading,
		refetch,
		pageInfo,
		searchInput,
		variant,
		includeDeleted,
		deleteProductId,
		setDeleteProductId,
		restoreProductId,
		setRestoreProductId,
		handleSearch,
		handleVariantChange,
		handleIncludeDeletedChange,
		handleReset,
		handleNext,
		handlePrevious,
	} = useProductsList();

	const hasFilters = Boolean(searchInput || variant || includeDeleted);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Produk</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button size="xs" asChild>
						<Link to="/admin/products/create">Tambah produk</Link>
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={searchInput}
					onSearchChange={handleSearch}
					searchPlaceholder="Cari nama produk..."
					onReset={hasFilters ? handleReset : undefined}
				>
					<Select value={variant ?? "all"} onValueChange={handleVariantChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua varian" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua varian</SelectItem>
							{Object.entries(variantConfig).map(([value, config]) => {
								const VariantIcon = config.icon;
								return (
									<SelectItem key={value} value={value}>
										<span className="text-muted-foreground inline-flex items-center gap-1.5">
											<VariantIcon className="size-3.5 shrink-0" />
											{config.label}
										</span>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<Select value={includeDeleted ? "true" : "false"} onValueChange={handleIncludeDeletedChange}>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="true">Semua produk</SelectItem>
							<SelectItem value="false">Hanya aktif</SelectItem>
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot>
					<AdminTable className="table-fixed">
						<AdminTableHeader>
							<AdminTableHead className="w-[34%] pl-3 sm:w-[36%]">Nama</AdminTableHead>
							<AdminTableHead className="w-[16%]">Varian</AdminTableHead>
							<AdminTableHead className="w-[22%] text-right sm:w-[14%]">Harga</AdminTableHead>
							<AdminTableHead className="w-[16%]">Tipe</AdminTableHead>
							<AdminTableHead className="hidden w-[14%] text-right sm:table-cell">Diperbarui</AdminTableHead>
							<AdminTableHead className="w-[12%] pr-3 text-right sm:w-[6%]">
								<span className="sr-only">Aksi</span>
							</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							columns={6}
							emptyMessage={hasFilters ? "Tidak ada produk yang cocok dengan filter ini." : "Belum ada produk."}
							emptyAction={
								hasFilters ? (
									<Button variant="outline" size="xs" onClick={handleReset}>
										Hapus filter
									</Button>
								) : (
									<Button asChild size="xs">
										<Link to="/admin/products/create">Tambah produk</Link>
									</Button>
								)
							}
						>
							{data?.items.map((product) => {
								const variantInfo = variantConfig[product.variant] ?? variantConfig.credits;
								const VariantIcon = variantInfo.icon;
								const isDeleted = !!product.deletedAt;

								return (
									<AdminTableRow key={product.id} className={cn(isDeleted && "opacity-50")}>
										<AdminTableCell className="pl-3">
											<TableRowStack
												title={
													<Link
														to="/admin/products/$productId"
														params={{ productId: product.id }}
														className={tableRowLinkClass}
													>
														{product.name}
													</Link>
												}
												subtitle={<span className="truncate font-mono">{product.slug}</span>}
											/>
										</AdminTableCell>

										<AdminTableCell>
											<span className="text-muted-foreground inline-flex items-center gap-1.5">
												<VariantIcon className="size-3.5 shrink-0" />
												{variantInfo.label}
											</span>
										</AdminTableCell>

										<AdminTableCell className="text-right">
											<span className="whitespace-nowrap tabular-nums">{formatRupiah(product.price)}</span>
										</AdminTableCell>

										<AdminTableCell>
											{product.type === "subscription" ? (
												<AdminChip tone="accent">Langganan</AdminChip>
											) : (
												<AdminMeta>Sekali beli</AdminMeta>
											)}
										</AdminTableCell>

										<AdminTableCell className="text-muted-foreground text-meta hidden text-right whitespace-nowrap sm:table-cell">
											{product.updatedAt ? formatDateMedium(new Date(product.updatedAt)) : "—"}
										</AdminTableCell>

										<AdminTableCell className="relative z-10 pr-3 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon-xs" aria-label={`Aksi untuk ${product.name}`}>
														<DotsThreeIcon className="size-4" weight="bold" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link to="/admin/products/$productId" params={{ productId: product.id }}>
															Buka produk
														</Link>
													</DropdownMenuItem>
													{isDeleted ? (
														<DropdownMenuItem onSelect={() => setRestoreProductId(product.id)}>
															<ArrowCounterClockwiseIcon className="size-4" /> Pulihkan produk
														</DropdownMenuItem>
													) : (
														<DropdownMenuItem variant="destructive" onSelect={() => setDeleteProductId(product.id)}>
															<TrashIcon className="size-4" /> Hapus produk
														</DropdownMenuItem>
													)}
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

			<DeleteProductDialog
				productId={deleteProductId ?? ""}
				open={!!deleteProductId}
				onOpenChange={(open) => !open && setDeleteProductId(null)}
				onSuccess={() => {
					setDeleteProductId(null);
					refetch();
				}}
			/>

			<RestoreProductDialog
				productId={restoreProductId ?? ""}
				open={!!restoreProductId}
				onOpenChange={(open) => !open && setRestoreProductId(null)}
				onSuccess={() => {
					setRestoreProductId(null);
					refetch();
				}}
			/>
		</AdminPageRoot>
	);
}
