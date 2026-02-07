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
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { orpc } from "@/utils/orpc";
import { AddUniversityDialog } from "./-components/add-university-dialog";

const searchSchema = type({
	page: "number = 0",
	"search?": "string",
});

export const Route = createFileRoute("/admin/passing-grades/")({
	component: RouteComponent,
	validateSearch: searchSchema,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { page = 0, search } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.university.universities.list.queryOptions({
			input: {
				cursor: (page ?? 0) * 10,
				limit: 10,
				search: search ?? undefined,
			},
		}),
	);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: {
				page: 0,
				...(value && { search: value }),
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			search: {
				page: newPage,
				...(search && { search }),
			},
		});
	};

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>Passing Grades</AdminPageTitle>
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
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<SearchInput
						value={searchInput}
						onChange={handleSearch}
						placeholder="Cari universitas..."
						className="w-full sm:max-w-sm md:max-w-md"
					/>
				</div>

				<div className="rounded-lg border bg-white shadow-sm">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12.5 text-center">No</TableHead>
									<TableHead>Nama Universitas</TableHead>
									<TableHead>Lokasi</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableSkeleton columns={4} />
								) : data?.data?.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
											Tidak ada universitas ditemukan.
										</TableCell>
									</TableRow>
								) : (
									data?.data?.map((uni, index) => (
										<TableRow key={uni.id} className="group hover:bg-muted/30">
											<TableCell className="text-center font-mono text-muted-foreground text-sm">
												{(page ?? 0) * 10 + index + 1}
											</TableCell>
											<TableCell className="font-medium">
												<Link
													to="/admin/passing-grades/$universityId"
													params={{ universityId: uni.id.toString() }}
													className="hover:underline"
												>
													{uni.name}
												</Link>
											</TableCell>
											<TableCell>{uni.location ?? "-"}</TableCell>
											<TableCell>
												<Badge variant={uni.isActive ? "default" : "secondary"}>
													{uni.isActive ? "Aktif" : "Tidak Aktif"}
												</Badge>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{data && (
						<div className="border-t p-4">
							<PaginationButtons
								page={(page ?? 0) + 1}
								onPrevious={() => handlePageChange((page ?? 0) - 1)}
								onNext={() => handlePageChange((page ?? 0) + 1)}
								hasPrevious={!!page && page > 0}
								hasNext={!!data.nextCursor}
								showPageInfo={false}
							/>
						</div>
					)}
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
