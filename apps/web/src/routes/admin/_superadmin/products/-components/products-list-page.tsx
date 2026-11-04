import { CalendarDotsIcon, PackageIcon, TrashIcon } from "@phosphor-icons/react";
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
import { AdminTablePaginationWrapper } from "@/components/admin/admin-table-toolbar";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { formatRelativeDate } from "@/lib/format-date";
import { formatRupiah } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useProductsList } from "../-hooks/use-products-list";
import { variantConfig } from "../-utils";
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
		handleNext,
		handlePrevious,
	} = useProductsList();

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Products</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button asChild>
						<Link to="/admin/products/create">
							<PackageIcon className="size-4" />
							Add Product
						</Link>
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<SearchInput
						value={searchInput}
						onChange={handleSearch}
						placeholder="Cari nama product..."
						className="w-full sm:max-w-sm md:max-w-md"
					/>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<Select value={variant ?? "all"} onValueChange={handleVariantChange}>
							<SelectTrigger className="w-full sm:w-40">
								<SelectValue placeholder="Semua Variant" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Variant</SelectItem>
								<SelectItem value="fixed_date">Fixed Date</SelectItem>
								<SelectItem value="monthly">Monthly</SelectItem>
								<SelectItem value="credits">Credits</SelectItem>
							</SelectContent>
						</Select>
						<Select value={includeDeleted ? "true" : "false"} onValueChange={handleIncludeDeletedChange}>
							<SelectTrigger className="w-full sm:w-40">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="false">Aktif</SelectItem>
								<SelectItem value="true">Semua (termasuk hapus)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<AdminTableRoot>
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead className="pl-4">Nama</AdminTableHead>
							<AdminTableHead>Variant</AdminTableHead>
							<AdminTableHead>Harga</AdminTableHead>
							<AdminTableHead>Type</AdminTableHead>
							<AdminTableHead className="min-w-32.5">Dibuat</AdminTableHead>
							<AdminTableHead className="pr-4 text-right">Aksi</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							columns={6}
							emptyMessage="Tidak ada product ditemukan."
						>
							{!isLoading && data?.items.length !== 0 && (
								<TooltipProvider delayDuration={200}>
									{data?.items.map((product) => {
										const variantInfo = variantConfig[product.variant] ?? variantConfig.credits;
										const VariantIcon = variantInfo.icon;
										const createdDate = product.createdAt ? new Date(product.createdAt) : null;
										const isDeleted = !!product.deletedAt;

										return (
											<AdminTableRow key={product.id} className={cn(isDeleted && "opacity-50")}>
												<AdminTableCell className="pl-4">
													<div className="flex flex-col">
														<Link
															to="/admin/products/$productId"
															params={{ productId: product.id }}
															className="text-foreground leading-tight font-semibold transition-colors hover:underline"
														>
															{product.name}
														</Link>
														<span className="text-muted-foreground text-xs leading-tight">{product.slug}</span>
													</div>
												</AdminTableCell>

												<AdminTableCell>
													<div className="flex items-center gap-1.5">
														<div
															className={cn("flex size-6 items-center justify-center rounded-md", variantInfo.bgColor)}
														>
															<VariantIcon className={cn("size-3.5", variantInfo.iconColor)} />
														</div>
														<span className="text-sm font-medium">{variantInfo.label}</span>
													</div>
												</AdminTableCell>

												<AdminTableCell>
													<span className="text-sm font-semibold">{formatRupiah(product.price)}</span>
												</AdminTableCell>

												<AdminTableCell>
													<span
														className={cn(
															"rounded-full px-2 py-0.5 text-xs font-medium capitalize",
															product.type === "subscription"
																? "bg-blue-100 text-blue-700"
																: "bg-green-100 text-green-700",
														)}
													>
														{product.type}
													</span>
												</AdminTableCell>

												<AdminTableCell>
													{createdDate ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="text-muted-foreground flex items-center gap-1.5 text-xs">
																	<CalendarDotsIcon className="size-3.5" />
																	{formatRelativeDate(createdDate)}
																</span>
															</TooltipTrigger>
															<TooltipContent>
																{createdDate.toLocaleDateString("id-ID", {
																	day: "numeric",
																	month: "long",
																	year: "numeric",
																})}
															</TooltipContent>
														</Tooltip>
													) : (
														<span className="text-muted-foreground text-xs">-</span>
													)}
												</AdminTableCell>

												<AdminTableCell className="pr-4 text-right">
													<div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
														{isDeleted ? (
															<Button variant="ghost" size="icon" onClick={() => setRestoreProductId(product.id)}>
																<TrashIcon className="size-4 text-green-500" />
															</Button>
														) : (
															<Button variant="ghost" size="icon" onClick={() => setDeleteProductId(product.id)}>
																<TrashIcon className="size-4" />
															</Button>
														)}
													</div>
												</AdminTableCell>
											</AdminTableRow>
										);
									})}
								</TooltipProvider>
							)}
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
