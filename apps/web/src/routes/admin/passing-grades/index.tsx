import { CaretLeftIcon, CaretRightIcon, EyeIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orpc } from "@/utils/orpc";
import { AddUniversityDialog } from "./-components/add-university-dialog";

export const Route = createFileRoute("/admin/passing-grades/")({
	component: RouteComponent,
});

type SearchParams = {
	page?: number;
	search?: string;
};

function RouteComponent() {
	const navigate = useNavigate({ from: Route.fullPath });
	const searchParams = Route.useSearch() as SearchParams;
	const page = searchParams.page;
	const search = searchParams.search;

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
			search: (prev: SearchParams) => ({ ...prev, search: value || undefined, page: 0 }),
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			search: (prev: SearchParams) => ({ ...prev, page: newPage }),
		});
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl text-primary-navy-900">Passing Grades</h1>
			</div>

			<div className="flex items-center justify-between gap-4">
				<SearchInput
					value={searchInput}
					onChange={handleSearch}
					placeholder="Cari universitas..."
					className="max-w-md"
				/>
				<AddUniversityDialog
					open={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
					onSuccess={() => {
						refetch();
					}}
				/>
			</div>

			<div className="rounded-lg border bg-white shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12.5">No</TableHead>
							<TableHead>Nama Universitas</TableHead>
							<TableHead>Lokasi</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									Memuat data...
								</TableCell>
							</TableRow>
						) : data?.data?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
									Tidak ada universitas ditemukan.
								</TableCell>
							</TableRow>
						) : (
							data?.data?.map((uni, index) => (
								<TableRow key={uni.id}>
									<TableCell>{(page ?? 0) * 10 + index + 1}</TableCell>
									<TableCell className="font-medium">{uni.name}</TableCell>
									<TableCell>{uni.location ?? "-"}</TableCell>
									<TableCell>
										<Badge variant={uni.isActive ? "default" : "secondary"}>
											{uni.isActive ? "Aktif" : "Tidak Aktif"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button variant="ghost" size="icon" asChild>
											<Link
												to="/admin/passing-grades/$universityId"
												params={{
													universityId: uni.id.toString(),
												}}
											>
												<EyeIcon className="size-4" />
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{data && (
					<div className="flex items-center justify-end gap-2 border-t p-4">
						<Button
							variant="outline"
							size="sm"
							disabled={!page || page <= 0}
							onClick={() => handlePageChange((page ?? 0) - 1)}
						>
							<CaretLeftIcon className="mr-2 size-4" />
							Previous
						</Button>
						<span className="mx-2 text-muted-foreground text-sm">Page {(page ?? 0) + 1}</span>
						<Button
							variant="outline"
							size="sm"
							disabled={!data.nextCursor}
							onClick={() => handlePageChange((page ?? 0) + 1)}
						>
							Next
							<CaretRightIcon className="ml-2 size-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
