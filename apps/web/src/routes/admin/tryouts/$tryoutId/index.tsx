import { ArrowLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";
import { AddSubtestDialog } from "../-components/add-subtest-dialog";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/")({
	component: TryoutDetailPage,
});

function TryoutDetailPage() {
	const { tryoutId } = Route.useParams();
	const id = Number.parseInt(tryoutId, 10);
	const isValidId = !Number.isNaN(id);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.tryout.getTryout.queryOptions({
			input: { id: isValidId ? id : 0 },
			enabled: isValidId,
		}),
	);

	const [isEditing, setIsEditing] = useState(false);
	const [isAddSubtestOpen, setIsAddSubtestOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		title: "",
		description: "",
		category: "utbk" as "sd" | "smp" | "sma" | "utbk",
		duration: 60,
		status: "draft" as "draft" | "published" | "archived",
		startsAt: "",
		endsAt: "",
	});

	const updateMutation = useMutation(
		orpc.admin.tryout.updateTryout.mutationOptions({
			onSuccess: () => {
				toast.success("Tryout berhasil diperbarui");
				setIsEditing(false);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	if (!isValidId) {
		return <div className="p-6 text-red-500">ID tryout tidak valid</div>;
	}

	const handleEdit = () => {
		if (data?.tryout) {
			setEditForm({
				title: data.tryout.title,
				description: data.tryout.description ?? "",
				category: data.tryout.category,
				duration: data.tryout.duration,
				status: data.tryout.status,
				startsAt: data.tryout.startsAt ? new Date(data.tryout.startsAt).toISOString().slice(0, 16) : "",
				endsAt: data.tryout.endsAt ? new Date(data.tryout.endsAt).toISOString().slice(0, 16) : "",
			});
			setIsEditing(true);
		}
	};

	const handleSave = () => {
		updateMutation.mutate({
			id,
			title: editForm.title,
			description: editForm.description || undefined,
			category: editForm.category,
			duration: editForm.duration,
			status: editForm.status,
			startsAt: editForm.startsAt || undefined,
			endsAt: editForm.endsAt || undefined,
		});
	};

	if (isLoading) {
		return <div className="p-6">Memuat...</div>;
	}

	if (!data?.tryout) {
		return <div className="p-6">Tryout tidak ditemukan</div>;
	}

	const tryout = data.tryout;
	const subtests = data.subtests ?? [];

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admin/tryouts">
						<ArrowLeftIcon className="size-4" />
					</Link>
				</Button>
				<h1 className="font-bold text-2xl text-primary-navy-900">Detail Tryout</h1>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Informasi Tryout</CardTitle>
						{!isEditing ? (
							<Button size="sm" onClick={handleEdit}>
								<PencilSimpleIcon className="mr-2 size-4" />
								Edit
							</Button>
						) : (
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
									Batal
								</Button>
								<Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
									{updateMutation.isPending ? "Menyimpan..." : "Simpan"}
								</Button>
							</div>
						)}
					</CardHeader>
					<CardContent className="space-y-4">
						{isEditing ? (
							<div className="space-y-4">
								<div>
									<Label>Judul</Label>
									<Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
								</div>
								<div>
									<Label>Deskripsi</Label>
									<Textarea
										value={editForm.description}
										onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
										rows={3}
									/>
								</div>
								<div>
									<Label>Kategori</Label>
									<Select
										value={editForm.category}
										onValueChange={(val) => setEditForm({ ...editForm, category: val as typeof editForm.category })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sd">SD</SelectItem>
											<SelectItem value="smp">SMP</SelectItem>
											<SelectItem value="sma">SMA</SelectItem>
											<SelectItem value="utbk">UTBK</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>Durasi (menit)</Label>
									<Input
										type="number"
										value={editForm.duration}
										onChange={(e) => setEditForm({ ...editForm, duration: e.target.valueAsNumber })}
									/>
								</div>
								<div>
									<Label>Status</Label>
									<Select
										value={editForm.status}
										onValueChange={(val) => setEditForm({ ...editForm, status: val as typeof editForm.status })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="published">Published</SelectItem>
											<SelectItem value="archived">Archived</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>Tanggal Mulai</Label>
									<Input
										type="datetime-local"
										value={editForm.startsAt}
										onChange={(e) => setEditForm({ ...editForm, startsAt: e.target.value })}
									/>
								</div>
								<div>
									<Label>Tanggal Selesai</Label>
									<Input
										type="datetime-local"
										value={editForm.endsAt}
										onChange={(e) => setEditForm({ ...editForm, endsAt: e.target.value })}
									/>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div>
									<Label className="text-muted-foreground">Judul</Label>
									<p className="font-medium">{tryout.title}</p>
								</div>
								{tryout.description && (
									<div>
										<Label className="text-muted-foreground">Deskripsi</Label>
										<p className="text-sm">{tryout.description}</p>
									</div>
								)}
								<div>
									<Label className="text-muted-foreground">Kategori</Label>
									<p className="font-medium">{tryout.category.toUpperCase()}</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Durasi</Label>
									<p className="font-medium">{tryout.duration} menit</p>
								</div>
								<div>
									<Label className="text-muted-foreground">Status</Label>
									<p className="font-medium">{tryout.status}</p>
								</div>
								{tryout.startsAt && (
									<div>
										<Label className="text-muted-foreground">Tanggal Mulai</Label>
										<p className="font-medium">{new Date(tryout.startsAt).toLocaleString("id-ID")}</p>
									</div>
								)}
								{tryout.endsAt && (
									<div>
										<Label className="text-muted-foreground">Tanggal Selesai</Label>
										<p className="font-medium">{new Date(tryout.endsAt).toLocaleString("id-ID")}</p>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Subtests</CardTitle>
						<AddSubtestDialog
							open={isAddSubtestOpen}
							onOpenChange={setIsAddSubtestOpen}
							onSuccess={() => refetch()}
							tryoutId={id}
						/>
					</CardHeader>
					<CardContent>
						{subtests.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground">Belum ada subtest</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12.5">No</TableHead>
										<TableHead>Nama</TableHead>
										<TableHead>Durasi</TableHead>
										<TableHead>Urutan Soal</TableHead>
										<TableHead className="text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{subtests.map((subtest, index) => (
										<TableRow key={subtest.id}>
											<TableCell>{index + 1}</TableCell>
											<TableCell className="font-medium">{subtest.name}</TableCell>
											<TableCell>{subtest.duration} menit</TableCell>
											<TableCell>{subtest.questionOrder === "random" ? "Acak" : "Berurutan"}</TableCell>
											<TableCell className="text-right">
												<Button variant="ghost" size="sm" asChild>
													<Link
														to="/admin/tryouts/$tryoutId/subtests/$subtestId"
														params={{ tryoutId, subtestId: subtest.id.toString() }}
													>
														Kelola Soal
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
