import { CaretLeftIcon, CaretRightIcon, EyeIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

const searchSchema = type({
	page: "number = 1",
	"search?": "string",
	"type?": "'multiple_choice' | 'multiple_choice_complex' | 'essay'",
	"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
	"tag?": "string",
});

export const Route = createFileRoute("/admin/questions/")({
	component: QuestionsListPage,
	validateSearch: searchSchema,
});

const QUESTION_TYPE_LABELS: Record<string, string> = {
	multiple_choice: "Pilihan Ganda",
	multiple_choice_complex: "Pilihan Ganda Kompleks",
	essay: "Esai",
};

const QUESTION_TYPE_BADGE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
	multiple_choice: "default",
	multiple_choice_complex: "secondary",
	essay: "outline",
};

function extractTextFromTiptap(content: unknown): string {
	if (typeof content === "string") {
		return content.replace(/<[^>]*>/g, " ").trim();
	}
	if (typeof content === "object" && content !== null) {
		const text: string[] = [];
		const extract = (node: unknown) => {
			if (typeof node === "string") {
				text.push(node);
			} else if (typeof node === "object" && node !== null) {
				const obj = node as Record<string, unknown>;
				if (obj.text && typeof obj.text === "string") {
					text.push(obj.text);
				}
				if (Array.isArray(obj.content)) {
					obj.content.forEach(extract);
				}
			}
		};
		extract(content);
		return text.join(" ").trim();
	}
	return String(content ?? "")
		.replace(/<[^>]*>/g, " ")
		.trim();
}

function truncateText(text: string, maxLength = 120): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trim()}...`;
}

function QuestionsListPage() {
	const navigate = useNavigate({ from: "/admin/questions/" });

	const search = Route.useSearch();
	const page = search.page ?? 1;
	const searchQuery = search.search;
	const questionType = search.type;
	const category = search.category;
	const tag = search.tag;

	const [searchInput, setSearchInput] = useState(searchQuery ?? "");
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.tryout.questions.listQuestions.queryOptions({
			input: {
				page,
				limit: 10,
				search: searchQuery,
				type: questionType,
				category,
				tag,
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.tryout.questions.deleteQuestion.mutationOptions({
			onSuccess: () => {
				toast.success("Soal berhasil dihapus");
				setDeleteDialogOpen(null);
				refetch();
				setSelectedIds((prev) => prev.filter((id) => id !== deleteDialogOpen));
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: { search: value || undefined, page: 1, type: questionType, category, tag },
		});
	};

	const handleTypeChange = (value: string) => {
		navigate({
			search: {
				type: value === "all" ? undefined : (value as "multiple_choice" | "multiple_choice_complex" | "essay"),
				page: 1,
				search: searchQuery,
				category,
				tag,
			},
		});
	};

	const handleCategoryChange = (value: string) => {
		navigate({
			search: {
				category: value === "all" ? undefined : (value as "sd" | "smp" | "sma" | "utbk"),
				page: 1,
				search: searchQuery,
				type: questionType,
				tag,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			search: { page: newPage, search: searchQuery, type: questionType, category, tag },
		});
	};

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	const handleBulkDelete = async () => {
		let successCount = 0;
		let errorCount = 0;

		for (const id of selectedIds) {
			try {
				await deleteMutation.mutateAsync({ id });
				successCount++;
			} catch {
				errorCount++;
			}
		}

		if (successCount > 0) {
			toast.success(`${successCount} soal berhasil dihapus`);
		}
		if (errorCount > 0) {
			toast.error(`${errorCount} soal gagal dihapus`);
		}

		setBulkDeleteDialogOpen(false);
		setSelectedIds([]);
		refetch();
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === (data?.questions.length ?? 0)) {
			setSelectedIds([]);
		} else {
			setSelectedIds(data?.questions.map((q) => q.id) ?? []);
		}
	};

	const toggleSelectOne = (id: number) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
	};

	const allSelected = selectedIds.length === (data?.questions.length ?? 0) && (data?.questions.length ?? 0) > 0;
	const someSelected = selectedIds.length > 0 && selectedIds.length < (data?.questions.length ?? 0);

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-primary-navy-900">Question Bank</h1>
					<p className="text-muted-foreground text-sm">Kelola soal-soal untuk tryout dan ujian</p>
				</div>
				<Button asChild>
					<Link to="/admin/questions/create">
						<PlusIcon className="mr-2 size-4" />
						Buat Soal
					</Link>
				</Button>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<SearchInput value={searchInput} onChange={handleSearch} placeholder="Cari soal..." className="max-w-md" />
				<div className="flex items-center gap-2">
					<Select value={questionType ?? "all"} onValueChange={handleTypeChange}>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Semua Tipe" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Tipe</SelectItem>
							<SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
							<SelectItem value="multiple_choice_complex">Pilihan Ganda Kompleks</SelectItem>
							<SelectItem value="essay">Esai</SelectItem>
						</SelectContent>
					</Select>
					<Select value={category ?? "all"} onValueChange={handleCategoryChange}>
						<SelectTrigger className="w-36">
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
				</div>
			</div>

			{selectedIds.length > 0 && (
				<div className="flex items-center gap-2 rounded-md border border-primary-navy-200 bg-primary-navy-50 p-2">
					<span className="text-primary-navy-700 text-sm">{selectedIds.length} soal dipilih</span>
					<AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm" className="ml-auto">
								<TrashIcon className="mr-2 size-4" />
								Hapus Terpilih
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Hapus Multiple Soal</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah Anda yakin ingin menghapus {selectedIds.length} soal yang dipilih? Tindakan ini tidak dapat
									dibatalkan.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
									Hapus
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			)}

			<div className="rounded-lg border bg-white shadow-sm">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">
									<Checkbox
										checked={someSelected ? "indeterminate" : allSelected}
										onCheckedChange={toggleSelectAll}
										aria-label="Select all"
									/>
								</TableHead>
								<TableHead className="w-16">ID</TableHead>
								<TableHead>Konten Soal</TableHead>
								<TableHead className="w-32">Tipe</TableHead>
								<TableHead>Tags</TableHead>
								<TableHead className="w-24 text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center">
										Memuat data...
									</TableCell>
								</TableRow>
							) : data?.questions.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
										Tidak ada soal ditemukan.
										<br />
										<span className="text-sm">Coba ubah filter atau buat soal baru.</span>
									</TableCell>
								</TableRow>
							) : (
								data?.questions.map((q) => {
									const contentPreview = truncateText(extractTextFromTiptap(q.content));
									return (
										<TableRow key={q.id}>
											<TableCell>
												<Checkbox
													checked={selectedIds.includes(q.id)}
													onCheckedChange={() => toggleSelectOne(q.id)}
													aria-label={`Select question ${q.id}`}
												/>
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-sm">#{q.id}</TableCell>
											<TableCell>
												<div className="max-w-md">
													<p className="text-sm leading-relaxed">{contentPreview || "(Konten kosong)"}</p>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant={QUESTION_TYPE_BADGE_VARIANTS[q.type] ?? "outline"}>
													{QUESTION_TYPE_LABELS[q.type] ?? q.type}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex max-w-32 flex-wrap gap-1">
													{q.tags?.slice(0, 3).map((t) => (
														<Badge key={t} variant="outline" className="text-xs">
															{t}
														</Badge>
													))}
													{q.tags && q.tags.length > 3 && (
														<Badge variant="outline" className="text-xs">
															+{q.tags.length - 3}
														</Badge>
													)}
													{!q.tags?.length && <span className="text-muted-foreground text-xs">-</span>}
												</div>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon">
															<PencilSimpleIcon className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link to="/admin/questions/$questionId" params={{ questionId: q.id }}>
																<EyeIcon className="mr-2 size-4" />
																Lihat Detail
															</Link>
														</DropdownMenuItem>
														<AlertDialog
															open={deleteDialogOpen === q.id}
															onOpenChange={(open) => setDeleteDialogOpen(open ? q.id : null)}
														>
															<AlertDialogTrigger asChild>
																<DropdownMenuItem
																	onSelect={(e) => e.preventDefault()}
																	className="text-red-600 focus:text-red-600"
																>
																	<TrashIcon className="mr-2 size-4" />
																	Hapus
																</DropdownMenuItem>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>Hapus Soal</AlertDialogTitle>
																	<AlertDialogDescription>
																		Apakah Anda yakin ingin menghapus soal #{q.id}? Tindakan ini tidak dapat dibatalkan.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Batal</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() => handleDelete(q.id)}
																		className="bg-red-600 hover:bg-red-700"
																	>
																		Hapus
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>

				{data && data.questions.length > 0 && (
					<div className="flex items-center justify-between border-t p-4">
						<div className="text-muted-foreground text-sm">
							Menampilkan {(page - 1) * data.limit + 1} - {Math.min(page * data.limit, data.total)} dari {data.total}{" "}
							soal
						</div>
						<div className="flex items-center gap-2">
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
					</div>
				)}
			</div>
		</div>
	);
}
