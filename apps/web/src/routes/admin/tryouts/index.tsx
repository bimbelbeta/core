import { CaretLeftIcon, CaretRightIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
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
import { orpc } from "@/utils/orpc";
import { AddTryoutDialog } from "./-components/add-tryout-dialog";

const searchSchema = type({
	page: "number = 1",
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
	const { page = 1, search, category, status } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.tryout.listTryouts.queryOptions({
			input: {
				page,
				limit: 10,
				search: search ?? undefined,
				category,
				status,
			},
		}),
	);

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
		navigate({
			search: { search: value || undefined, page: 1, category, status },
		});
	};

	const handleCategoryChange = (value: string) => {
		navigate({
			search: {
				category: value === "all" ? undefined : (value as "sd" | "smp" | "sma" | "utbk"),
				page: 1,
				search,
				status,
			},
		});
	};

	const handleStatusChange = (value: string) => {
		navigate({
			search: {
				status: value === "all" ? undefined : (value as "draft" | "published" | "archived"),
				page: 1,
				search,
				category,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			search: { page: newPage, search, category, status },
		});
	};

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl text-primary-navy-900">Tryout Management</h1>
				<AddTryoutDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={() => refetch()} />
			</div>

			<div className="flex items-center justify-between gap-4">
				<SearchInput value={searchInput} onChange={handleSearch} placeholder="Cari tryout..." className="max-w-md" />
				<div className="flex items-center gap-2">
					<Select value={category ?? "all"} onValueChange={handleCategoryChange}>
						<SelectTrigger className="w-40">
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
						<SelectTrigger className="w-40">
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

			<div className="rounded-lg border bg-white shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12.5">No</TableHead>
							<TableHead>Judul</TableHead>
							<TableHead>Kategori</TableHead>
							<TableHead>Durasi</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Dibuat</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={7} className="h-24 text-center">
									Memuat data...
								</TableCell>
							</TableRow>
						) : data?.tryouts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
									Tidak ada tryout ditemukan.
								</TableCell>
							</TableRow>
						) : (
							data?.tryouts.map((tryout, index) => (
								<TableRow key={tryout.id}>
									<TableCell>{(page - 1) * 10 + index + 1}</TableCell>
									<TableCell className="font-medium">{tryout.title}</TableCell>
									<TableCell>
										<Badge variant="outline">{tryout.category.toUpperCase()}</Badge>
									</TableCell>
									<TableCell>{tryout.duration} menit</TableCell>
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
											<Button variant="ghost" size="icon" asChild>
												<Link to="/admin/tryouts/$tryoutId" params={{ tryoutId: tryout.id.toString() }}>
													<PencilSimpleIcon className="size-4" />
												</Link>
											</Button>
											<AlertDialog
												open={deleteDialogOpen === tryout.id}
												onOpenChange={(open) => setDeleteDialogOpen(open ? tryout.id : null)}
											>
												<AlertDialogTrigger asChild>
													<Button variant="ghost" size="icon">
														<TrashIcon className="size-4 text-red-600" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
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

				{data && (
					<div className="flex items-center justify-end gap-2 border-t p-4">
						<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
							<CaretLeftIcon className="mr-2 size-4" />
							Previous
						</Button>
						<span className="mx-2 text-muted-foreground text-sm">
							Page {page} of {Math.ceil(data.total / data.limit)}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= Math.ceil(data.total / data.limit)}
							onClick={() => handlePageChange(page + 1)}
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
