import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { CalendarDotsIcon, PackageIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
import { PaginationButtons } from "@/components/admin/pagination-buttons";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { DeleteProductDialog } from "./-components/delete-product-dialog";
import { RestoreProductDialog } from "./-components/restore-product-dialog";
import { formatCurrency, formatRelativeDate, variantConfig } from "./-utils";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"variant?": "'fixed_date' | 'monthly' | 'credits'",
	"includeDeleted?": "boolean",
});

export const Route = createFileRoute("/admin/_superadmin/products/")({
	staticData: { breadcrumb: "Products" },
	component: ProductsListPage,
	validateSearch: searchSchema,
});

function ProductsListPage() {
	const navigate = Route.useNavigate();
	const { after, before, limit = 10, search, variant, includeDeleted } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.products.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				variant,
				includeDeleted,
			},
		}),
	);

	const pageInfo = data?.pageInfo;

	const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
	const [restoreProductId, setRestoreProductId] = useState<string | null>(null);

	const baseSearchParams = {
		...(search && { search }),
		...(variant && { variant }),
		...(includeDeleted !== undefined && { includeDeleted }),
		limit,
	};

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: {
				...(value && { search: value }),
				...(variant && { variant }),
				...(includeDeleted !== undefined && { includeDeleted }),
				limit,
			},
		});
	};

	const handleVariantChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(value !== "all" && { variant: value as "fixed_date" | "monthly" | "credits" }),
				...(includeDeleted !== undefined && { includeDeleted }),
				limit,
			},
		});
	};

	const handleIncludeDeletedChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(variant && { variant }),
				...(value === "true" && { includeDeleted: true }),
				limit,
			},
		});
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>Products</AdminPageTitle>
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

				<div className="overflow-clip rounded-lg border bg-white shadow-sm">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30">
								<TableHead className="pl-4">Nama</TableHead>
								<TableHead>Variant</TableHead>
								<TableHead>Harga</TableHead>
								<TableHead>Type</TableHead>
								<TableHead className="min-w-32.5">Dibuat</TableHead>
								<TableHead className="pr-4 text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableSkeleton columns={6} />
							) : data?.items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
										Tidak ada product ditemukan.
									</TableCell>
								</TableRow>
							) : (
								<TooltipProvider delayDuration={200}>
									{data?.items.map((product) => {
										const variantInfo = variantConfig[product.variant] ?? variantConfig.credits;
										const VariantIcon = variantInfo.icon;
										const createdDate = product.createdAt ? new Date(product.createdAt) : null;
										const isDeleted = !!product.deletedAt;

										return (
											<TableRow key={product.id} className={cn("group hover:bg-muted/30", isDeleted && "opacity-50")}>
												<TableCell className="pl-4">
													<div className="flex flex-col">
														<Link
															to="/admin/products/$productId"
															params={{ productId: product.id }}
															className="font-semibold text-foreground leading-tight transition-colors hover:underline"
														>
															{product.name}
														</Link>
														<span className="text-muted-foreground text-xs leading-tight">{product.slug}</span>
													</div>
												</TableCell>

												<TableCell>
													<div className="flex items-center gap-1.5">
														<div
															className={cn("flex size-6 items-center justify-center rounded-md", variantInfo.bgColor)}
														>
															<VariantIcon className={cn("size-3.5", variantInfo.iconColor)} />
														</div>
														<span className="font-medium text-sm">{variantInfo.label}</span>
													</div>
												</TableCell>

												<TableCell>
													<span className="font-semibold text-sm">{formatCurrency(product.price)}</span>
												</TableCell>

												<TableCell>
													<span
														className={cn(
															"rounded-full px-2 py-0.5 font-medium text-xs capitalize",
															product.type === "subscription"
																? "bg-blue-100 text-blue-700"
																: "bg-green-100 text-green-700",
														)}
													>
														{product.type}
													</span>
												</TableCell>

												<TableCell>
													{createdDate ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
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
												</TableCell>

												<TableCell className="pr-4 text-right">
													<div className="flex items-center justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
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
												</TableCell>
											</TableRow>
										);
									})}
								</TooltipProvider>
							)}
						</TableBody>
					</Table>

					{data && (
						<div className="border-t p-4">
							<PaginationButtons
								onPrevious={handlePrevious}
								onNext={handleNext}
								hasPrevious={!!pageInfo?.hasPreviousPage}
								hasNext={!!pageInfo?.hasNextPage}
							/>
						</div>
					)}
				</div>
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
