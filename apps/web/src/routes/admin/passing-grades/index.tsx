import { PaginationInputSchema } from "@bimbelbeta/contract/common/pagination";
import { ArrowSquareOutIcon, DotsThreeIcon } from "@phosphor-icons/react";
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
import { TableRowStack, tableRowLinkClass } from "@/components/ui/table-row-stack";
import { Typography } from "@/components/ui/typography";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import { withoutSearchKey } from "@/lib/tanstack-router-utils";
import { AddUniversityDialog } from "./-components/add-university-dialog";

const searchSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"isActive?": "boolean",
});

export const Route = createFileRoute("/admin/passing-grades/")({
	staticData: { breadcrumb: "Passing grade" },
	component: RouteComponent,
	validateSearch: searchSchema,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { after, before, limit = 10, search, isActive } = Route.useSearch();

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.university.universities.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				isActive,
			},
		}),
	);

	const pageInfo = data?.pageInfo;

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	const baseSearchParams = {
		...(search && { search }),
		...(isActive !== undefined && { isActive }),
		limit,
	};

	const handleSearch = (value: string) => {
		navigate({
			search: {
				...(value && { search: value }),
				limit,
			},
		});
	};

	const handleReset = () => {
		navigate({ search: { limit } });
	};

	const handleStatusChange = (value: string) => {
		const rest = withoutSearchKey(baseSearchParams, "isActive");
		navigate({ search: value === "all" ? rest : { ...rest, isActive: value === "true" } });
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Passing grade</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<AddUniversityDialog
						open={isAddDialogOpen}
						onOpenChange={setIsAddDialogOpen}
						onSuccess={() => {
							refetch();
						}}
					/>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={search ?? ""}
					onSearchChange={handleSearch}
					searchPlaceholder="Cari universitas..."
					onReset={search || isActive !== undefined ? handleReset : undefined}
				>
					<Select
						value={isActive === undefined ? "all" : isActive ? "true" : "false"}
						onValueChange={handleStatusChange}
					>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua status</SelectItem>
							<SelectItem value="true">
								<AdminStatus tone="positive">Aktif</AdminStatus>
							</SelectItem>
							<SelectItem value="false">
								<AdminStatus tone="neutral">Nonaktif</AdminStatus>
							</SelectItem>
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot>
					<AdminTable className="table-fixed">
						<AdminTableHeader>
							<AdminTableHead className="w-[36%] pl-3">Universitas</AdminTableHead>
							<AdminTableHead className="w-[10%] text-right">Prodi</AdminTableHead>
							<AdminTableHead className="hidden w-[13%] text-right sm:table-cell">Skor</AdminTableHead>
							<AdminTableHead className="w-[13%]">Status</AdminTableHead>
							<AdminTableHead className="hidden w-[22%] text-right sm:table-cell">Diperbarui</AdminTableHead>
							<AdminTableHead className="w-[6%] pr-3 text-right">
								<span className="sr-only">Aksi</span>
							</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={isLoading}
							isEmpty={!isLoading && data?.items.length === 0}
							columns={6}
							emptyMessage={
								search ? "Tidak ada universitas yang cocok dengan pencarian ini." : "Belum ada universitas."
							}
							emptyAction={
								search ? (
									<Button variant="outline" size="xs" onClick={handleReset}>
										Hapus filter
									</Button>
								) : undefined
							}
						>
							{data?.items.map((uni) => (
								<AdminTableRow key={uni.id}>
									<AdminTableCell className="pl-3">
										<TableRowStack
											title={
												<Link
													to="/admin/passing-grades/$universityId"
													params={{ universityId: uni.id.toString() }}
													className={tableRowLinkClass}
												>
													{uni.name}
												</Link>
											}
											subtitle={<span className="truncate">{uni.location ?? "Lokasi belum diisi"}</span>}
										/>
									</AdminTableCell>
									<AdminTableCell className="text-right">
										<span className="tabular-nums">{uni.programCount}</span>
									</AdminTableCell>
									<AdminTableCell className="hidden text-right sm:table-cell">
										<span className="tabular-nums">
											{uni.scoreMin !== null && uni.scoreMax !== null
												? uni.scoreMin === uni.scoreMax
													? `${uni.scoreMin}`
													: `${uni.scoreMin}–${uni.scoreMax}`
												: "—"}
										</span>
									</AdminTableCell>
									<AdminTableCell>
										<AdminStatus tone={uni.isActive ? "positive" : "neutral"}>
											{uni.isActive ? "Aktif" : "Nonaktif"}
										</AdminStatus>
									</AdminTableCell>
									<AdminTableCell className="text-muted-foreground text-meta hidden text-right whitespace-nowrap sm:table-cell">
										{uni.updatedAt ? formatDateMedium(new Date(uni.updatedAt)) : "—"}
									</AdminTableCell>
									<AdminTableCell className="relative z-10 pr-3 text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon-xs" aria-label={`Aksi untuk ${uni.name}`}>
													<DotsThreeIcon className="size-4" weight="bold" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem asChild>
													<Link to="/admin/passing-grades/$universityId" params={{ universityId: uni.id.toString() }}>
														<ArrowSquareOutIcon className="size-4" /> Buka detail
													</Link>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
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
								totalCount={pageInfo?.totalCount}
							/>
						</AdminTablePaginationWrapper>
					)}
				</AdminTableRoot>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
