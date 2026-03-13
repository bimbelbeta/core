import { TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
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
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { orpc } from "@/utils/orpc";
import { AddTryoutDialog } from "./-components/add-tryout-dialog";

const searchSchema = type({
	"cursor?": "number",
	"search?": "string",
	"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
	"status?": "'draft' | 'published' | 'archived'",
});

export const Route = createFileRoute("/admin/tryouts/")({
	component: TryoutsListPage,
	validateSearch: searchSchema,
});

function TryoutsListPage() {
	const navigate = Route.useNavigate();
	const { cursor, search, category, status } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

	const pagination = useCursorPagination<number>({
		urlCursor: cursor,
		onCursorChange: (newCursor) => navigate({ search: { cursor: newCursor, search, category, status } }),
		pageSize: 10,
	});

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.tryout.list.queryOptions({
			input: {
				cursor: pagination.currentCursor,
				limit: pagination.pageSize,
				search: search ?? undefined,
				category,
				status,
			},
		}),
	);

	// Sync canGoNext with data
	if (pagination.canGoNext !== !!data?.nextCursor) {
		pagination.setCanGoNext(!!data?.nextCursor);
	}

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

	const deleteMutation = useMutation(
		orpc.admin.tryout.deleteTryout.mutationOptions({
			onSuccess: () => {
				toast.success("Tryout berhasil dihapus");
				setDeleteDialogOpen(null);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleSearch = (value: string) => {
		setSearchInput(value);
		pagination.reset();
		navigate({
			search: {
				...(value && { search: value }),
				...(category && { category }),
				...(status && { status }),
			},
		});
	};

	const handleCategoryChange = (value: string) => {
		pagination.reset();
		navigate({
			search: {
				...(search && { search }),
				...(value !== "all" && { category: value as "sd" | "smp" | "sma" | "utbk" }),
				...(status && { status }),
			},
		});
	};

	const handleStatusChange = (value: string) => {
		pagination.reset();
		navigate({
			search: {
				...(search && { search }),
				...(category && { category }),
				...(value !== "all" && { status: value as "draft" | "published" | "archived" }),
			},
		});
	};

	const handleNext = () => {
		if (!data?.nextCursor) return;
		pagination.handleNext(data.nextCursor);
	};

	const handlePrevious = () => {
		pagination.handlePrevious();
	};

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>Tryout Management</AdminPageTitle>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<AddTryoutDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={() => refetch()} />
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<SearchInput
						value={searchInput}
						onChange={handleSearch}
						placeholder="Cari tryout..."
						className="w-full sm:max-w-sm md:max-w-md"
					/>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<Select value={category ?? "all"} onValueChange={handleCategoryChange}>
							<SelectTrigger className="w-full sm:w-40">
								<SelectValue placeholder="Semua Kategori" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Kategori</SelectItem>
								<SelectItem value="sd">SD</SelectItem>
								<SelectItem value="smp">SMP</SelectItem>
								<SelectItem value="sma">SMA</SelectItem>
								<SelectItem value="utbk">UTBK</SelectItem>
							</SelectContent>
						</Select>
						<Select value={status ?? "all"} onValueChange={handleStatusChange}>
							<SelectTrigger className="w-full sm:w-40">
								<SelectValue placeholder="Semua Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="published">Published</SelectItem>
								<SelectItem value="archived">Archived</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="overflow-clip rounded-lg border bg-white shadow-sm">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12.5 text-center">No</TableHead>
									<TableHead>Judul</TableHead>
									<TableHead>Kategori</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Dibuat</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableSkeleton columns={6} />
								) : data?.tryouts.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
											Tidak ada tryout ditemukan.
										</TableCell>
									</TableRow>
								) : (
									data?.tryouts.map((tryout, index) => (
										<TableRow key={tryout.id} className="group hover:bg-muted/30">
											<TableCell className="text-center font-mono text-muted-foreground text-sm">{index + 1}</TableCell>
											<TableCell className="font-medium">
												<Link
													to="/admin/tryouts/$tryoutId"
													params={{ tryoutId: tryout.id.toString() }}
													className="hover:underline"
												>
													{tryout.title}
												</Link>
											</TableCell>
											<TableCell>
												<Badge variant="outline">{tryout.category.toUpperCase()}</Badge>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														tryout.status === "published"
															? "default"
															: tryout.status === "archived"
																? "secondary"
																: "outline"
													}
												>
													{tryout.status}
												</Badge>
											</TableCell>
											<TableCell>
												{tryout.createdAt ? new Date(tryout.createdAt).toLocaleDateString("id-ID") : "-"}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<AlertDialog
														open={deleteDialogOpen === tryout.id}
														onOpenChange={(open) => setDeleteDialogOpen(open ? tryout.id : null)}
													>
														<AlertDialogTrigger asChild>
															<Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
																<TrashIcon className="size-4 text-red-600" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent onClick={(e) => e.stopPropagation()}>
															<AlertDialogHeader>
																<AlertDialogTitle>Hapus Tryout</AlertDialogTitle>
																<AlertDialogDescription>
																	Apakah Anda yakin ingin menghapus tryout "{tryout.title}"? Tindakan ini tidak dapat
																	dibatalkan.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Batal</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() => handleDelete(tryout.id)}
																	className="bg-red-600 hover:bg-red-700"
																>
																	Hapus
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
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
								onPrevious={handlePrevious}
								onNext={handleNext}
								hasPrevious={pagination.canGoPrevious}
								hasNext={pagination.canGoNext}
							/>
						</div>
					)}
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
