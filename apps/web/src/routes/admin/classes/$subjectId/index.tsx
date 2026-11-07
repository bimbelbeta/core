import { ArrowLeftIcon, PlusIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import type { ContentListItem } from "@/components/classes/classes-types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { gradeLabel } from "@/lib/formatter";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { ContentsList } from "../-components/contents-list";

const searchSchema = type({
	"q?": "string",
	"after?": "string",
});

export const Route = createFileRoute("/admin/classes/$subjectId/")({
	staticData: { breadcrumb: "Subject", breadcrumbParent: { label: "Kelas", to: "/admin/classes" } },
	component: RouteComponent,
	validateSearch: searchSchema,
});

function RouteComponent() {
	const { subjectId: rawSubjectId } = Route.useParams();
	const subjectId = parseRouteParamToNumber(rawSubjectId);
	const queryClient = useQueryClient();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<ContentListItem | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingItem, setDeletingItem] = useState<ContentListItem | null>(null);

	const { q = "", after } = Route.useSearch();
	const searchQuery = q;

	const navigate = Route.useNavigate();
	const updateSearch = (updates: { q?: string; after?: string }) => {
		const newQ = updates.q !== undefined ? updates.q : q;
		const newAfter = updates.q !== undefined && updates.q !== q ? undefined : updates.after;

		navigate({
			search: newQ ? { q: newQ, after: newAfter } : { after: newAfter },
		});
	};

	const contents = useQuery(
		orpc.subject.listContent.queryOptions({
			input: {
				subjectId,
				search: searchQuery || undefined,
				limit: 20,
				after,
			},
		}),
	);

	const invalidateContent = () => queryClient.invalidateQueries({ queryKey: orpc.subject.listContent.key() });

	const createMutation = useMutation(
		orpc.admin.content.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				invalidateContent();
				setCreateDialogOpen(false);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal membuat konten");
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.admin.content.update.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				invalidateContent();
				setEditDialogOpen(false);
				setEditingItem(null);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal memperbarui konten");
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.content.remove.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				invalidateContent();
				setDeleteDialogOpen(false);
				setDeletingItem(null);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menghapus konten");
			},
		}),
	);

	const reorderMutation = useMutation(
		orpc.admin.content.reorder.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				invalidateContent();
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

	if (contents.isPending && !contents.data) {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<Skeleton className="h-7 w-48" />
					</AdminPageHeaderContent>
				</AdminPageHeader>
				<AdminPageContent>
					<div className="flex flex-col gap-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i.toString()} className="h-14 w-full" />
						))}
					</div>
				</AdminPageContent>
			</AdminPageRoot>
		);
	}

	if (contents.isError) {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<Typography variant="title">Subject tidak ditemukan</Typography>
					</AdminPageHeaderContent>
				</AdminPageHeader>
				<AdminPageContent>
					<Typography tone="destructive">Error: {contents.error.message}</Typography>
					<Button variant="outline" size="sm" onClick={() => contents.refetch()}>
						Coba lagi
					</Button>
				</AdminPageContent>
			</AdminPageRoot>
		);
	}

	if (!contents.data) return notFound();

	const subject = contents.data.subject;

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" aria-label="Kembali" asChild>
							<Link to="/admin/classes">
								<ArrowLeftIcon className="size-4" />
							</Link>
						</Button>
						<Typography variant="title">{subject.name}</Typography>
					</div>
					<Typography variant="body" tone="muted">
						{gradeLabel(subject.category, subject.gradeLevel)}
					</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button size="sm" className="h-9" onClick={handleCreate}>
						<PlusIcon className="size-4" />
						Tambah konten
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={searchQuery}
					onSearchChange={(value) => updateSearch({ q: value })}
					searchPlaceholder="Cari konten..."
					onReset={searchQuery ? () => updateSearch({ q: "" }) : undefined}
				/>

				<ContentsList
					items={contents.data.items}
					isPending={contents.isPending}
					subjectId={subjectId}
					searchQuery={searchQuery}
					showCount={Boolean(searchQuery)}
					hasMore={!!contents.data.pageInfo?.hasNextPage}
					onLoadMore={() => updateSearch({ after: contents.data?.pageInfo?.endCursor ?? undefined })}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onReorder={handleReorder}
				/>
			</AdminPageContent>

			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah konten</DialogTitle>
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
										<Typography key={error?.message} tone="destructive">
											{error?.message}
										</Typography>
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
									<Label htmlFor={field.name} className="text-sm font-normal">
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
									<Button
										isPending={createMutation.isPending}
										type="submit"
										disabled={!state.canSubmit || createMutation.isPending}
									>
										{"Simpan"}
									</Button>
								)}
							</createForm.Subscribe>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

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
										<Typography key={error?.message} tone="destructive">
											{error?.message}
										</Typography>
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
									<Button
										isPending={updateMutation.isPending}
										type="submit"
										disabled={!state.canSubmit || updateMutation.isPending}
									>
										{"Simpan"}
									</Button>
								)}
							</editForm.Subscribe>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Konten?</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus konten "{deletingItem?.title}"? Tindakan ini tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Batal</AlertDialogCancel>
						<AlertDialogAction
							isPending={deleteMutation.isPending}
							onClick={() => {
								if (deletingItem) {
									deleteMutation.mutate({ id: deletingItem.id });
								}
							}}
							disabled={deleteMutation.isPending}
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</AdminPageRoot>
	);
}
