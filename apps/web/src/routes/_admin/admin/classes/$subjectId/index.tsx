import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import { ClassHeader } from "@/components/classes/class-header";
import { ContentList } from "@/components/classes/content-list";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import type { BodyOutputs } from "@/utils/orpc";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/admin/classes/$subjectId/")({
	params: {
		parse: (raw) => ({
			subjectId: Number(raw.subjectId),
		}),
	},
	component: RouteComponent,
});

type ContentListItem = NonNullable<BodyOutputs["subject"]["listContentBySubjectCategory"]>[number];

type Search = {
	q?: string;
	page?: number;
};

function RouteComponent() {
	const { subjectId } = Route.useParams();
	const queryClient = useQueryClient();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<ContentListItem | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingItem, setDeletingItem] = useState<ContentListItem | null>(null);

	const searchParams = Route.useSearch();
	const searchQuery = (searchParams as Search).q ?? "";
	const page = (searchParams as Search).page ?? 0;

	const navigate = Route.useNavigate();
	const updateSearch = (updates: Partial<Search>) => {
		const newSearch: Partial<Search> = {};

		if (updates.q !== undefined) {
			newSearch.q = updates.q || undefined;
		}
		if (updates.page !== undefined) {
			newSearch.page = updates.page;
		}

		if (updates.q !== undefined && updates.q !== (searchParams as Search).q) {
			newSearch.page = 0;
		}

		// Remove undefined values to avoid ?q=undefined in URL
		const cleanSearch = Object.fromEntries(Object.entries(newSearch).filter(([, value]) => value !== undefined));

		navigate({ search: cleanSearch });
	};

	const contents = useQuery(
		orpc.subject.listContentBySubjectCategory.queryOptions({
			input: {
				subjectId: Number(subjectId),
				search: searchQuery || undefined,
				limit: 20,
				offset: page * 20,
			},
		}),
	);

	const createMutation = useMutation(
		orpc.admin.subject.createContent.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries();
				setCreateDialogOpen(false);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal membuat konten");
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.admin.subject.updateContent.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries();
				setEditDialogOpen(false);
				setEditingItem(null);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal memperbarui konten");
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.subject.deleteContent.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries();
				setDeleteDialogOpen(false);
				setDeletingItem(null);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menghapus konten");
			},
		}),
	);

	const reorderMutation = useMutation(
		orpc.admin.subject.reorderContent.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries();
			},
			onError: (error) => {
				toast.error(error.message || "Gagal mengubah urutan konten");
			},
		}),
	);

	const createForm = useForm({
		defaultValues: {
			title: "",
			withNote: true,
		},
		onSubmit: async ({ value }) => {
			if (!contents.data?.subject?.id) return;
			const items = contents.data.items;
			const maxOrder = items && items.length > 0 ? Math.max(...items.map((i) => i.order ?? 0)) : 0;

			if (!value.withNote) {
				toast.error("Konten baru harus memiliki minimal satu komponen. Aktifkan catatan materi.");
				return;
			}

			createMutation.mutate({
				subjectId: contents.data.subject.id,
				title: value.title,
				order: maxOrder + 1,
				note: value.withNote ? { content: {} } : undefined,
			});
		},
		validators: {
			onSubmit: type({
				title: "string >= 1",
			}),
		},
	});

	const editForm = useForm({
		defaultValues: {
			title: "",
		},
		onSubmit: async ({ value }) => {
			if (!editingItem) return;
			updateMutation.mutate({
				id: editingItem.id,
				title: value.title,
			});
		},
		validators: {
			onSubmit: type({
				title: "string >= 1",
			}),
		},
	});

	const handleCreate = () => {
		setCreateDialogOpen(true);
		createForm.reset();
	};

	const handleEdit = (item: ContentListItem) => {
		setEditingItem(item);
		editForm.setFieldValue("title", item.title);
		setEditDialogOpen(true);
	};

	const handleDelete = (item: ContentListItem) => {
		setDeletingItem(item);
		setDeleteDialogOpen(true);
	};

	const handleReorder = (newItems: ContentListItem[]) => {
		if (!contents.data?.subject?.id || newItems.length === 0) return;

		const updatedItems = newItems.map((item, index) => ({
			id: item.id,
			order: index + 1,
		}));

		reorderMutation.mutate({
			subjectId: contents.data.subject.id,
			items: updatedItems,
		});
	};

	if (contents.isPending) {
		return (
			<div className="mx-auto max-w-6xl">
				<Container className="pt-12">
					<p className="animate-pulse text-sm">Memuat kelas...</p>
				</Container>
			</div>
		);
	}

	if (contents.isError) {
		return (
			<div className="mx-auto max-w-6xl">
				<Container className="pt-12">
					<p className="text-red-500 text-sm">Error: {contents.error.message}</p>
				</Container>
			</div>
		);
	}
	if (!contents.data) return notFound();

	return (
		<Container className="px-0 pt-0">
			<ClassHeader subject={contents.data.subject} />
			<div className="sticky top-0 z-10 space-y-4 border-b bg-background/95 pb-4 backdrop-blur">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="w-full flex-1 sm:max-w-md">
						<SearchInput value={searchQuery} onChange={(q) => updateSearch({ q })} placeholder="Cari konten..." />
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<ContentList
					items={contents.data.items}
					isLoading={contents.isPending}
					error={contents.isError ? contents.error.message : undefined}
					searchQuery={searchQuery}
					showCount={Boolean(searchQuery)}
					hasMore={contents.data.items?.length === 20}
					onLoadMore={() => updateSearch({ page: page + 1 })}
					onCreate={handleCreate}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onReorder={handleReorder}
					subjectId={Number(subjectId)}
				/>
			</div>

			{/* Create Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Konten</DialogTitle>
						<DialogDescription>Buat konten baru</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							createForm.handleSubmit();
						}}
						className="space-y-4"
					>
						<createForm.Field name="title">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Judul</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Masukkan judul konten"
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</createForm.Field>
						<createForm.Field name="withNote">
							{(field) => (
								<div className="flex items-center gap-2">
									<Checkbox
										id={field.name}
										checked={field.state.value}
										onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
									/>
									<Label htmlFor={field.name} className="font-normal text-sm">
										Buat catatan materi awal (minimal satu komponen per konten)
									</Label>
								</div>
							)}
						</createForm.Field>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
								Batal
							</Button>
							<createForm.Subscribe>
								{(state) => (
									<Button type="submit" disabled={!state.canSubmit || createMutation.isPending}>
										{createMutation.isPending ? "Menyimpan..." : "Simpan"}
									</Button>
								)}
							</createForm.Subscribe>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Konten</DialogTitle>
						<DialogDescription>Ubah judul konten</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							editForm.handleSubmit();
						}}
						className="space-y-4"
					>
						<editForm.Field name="title">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Judul</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Masukkan judul konten"
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</editForm.Field>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setEditDialogOpen(false);
									setEditingItem(null);
								}}
							>
								Batal
							</Button>
							<editForm.Subscribe>
								{(state) => (
									<Button type="submit" disabled={!state.canSubmit || updateMutation.isPending}>
										{updateMutation.isPending ? "Menyimpan..." : "Simpan"}
									</Button>
								)}
							</editForm.Subscribe>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Konten?</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus konten "{deletingItem?.title}
							"? Tindakan ini tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deletingItem) {
									deleteMutation.mutate({ id: deletingItem.id });
								}
							}}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? "Menghapus..." : "Hapus"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Container>
	);
}
