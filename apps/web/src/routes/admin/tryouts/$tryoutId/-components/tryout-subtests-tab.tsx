import { ClockIcon, FileTextIcon, ListDashesIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { orpc } from "@/utils/orpc";
import { AddSubtestDialog } from "./add-subtest-dialog";

interface TryoutSubtestsTabProps {
	tryoutId: number;
	subtests: {
		id: number;
		tryoutId: number;
		name: string;
		description: string | null;
		duration: number;
		questionOrder: string;
		order: number;
	}[];
	onUpdate: () => void;
}

export function TryoutSubtestsTab({ tryoutId, subtests, onUpdate }: TryoutSubtestsTabProps) {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

	const deleteMutation = useMutation(
		orpc.admin.tryout.subtest.deleteSubtest.mutationOptions({
			onSuccess: () => {
				toast.success("Subtest berhasil dihapus");
				setDeleteDialogOpen(null);
				onUpdate();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	const totalDuration = subtests.reduce((acc, s) => acc + s.duration, 0);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="flex flex-row items-start justify-between gap-4">
					<div className="space-y-1">
						<CardTitle className="flex items-center gap-2">
							<ListDashesIcon className="size-5" />
							Daftar Subtest
						</CardTitle>
						<CardDescription>
							{subtests.length === 0
								? "Belum ada subtest. Tambahkan subtest untuk mulai membuat soal."
								: `Kelola ${subtests.length} subtest dalam tryout ini.`}
						</CardDescription>
						{subtests.length > 0 && (
							<div className="flex items-center gap-4 pt-2 text-sm">
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<ClockIcon className="size-4" />
									<span>Total durasi: {totalDuration} menit</span>
								</div>
							</div>
						)}
					</div>
					<Button onClick={() => setIsAddDialogOpen(true)} className="shrink-0">
						<PlusIcon className="mr-2 size-4" />
						Tambah Subtest
					</Button>
				</CardHeader>
				<CardContent>
					{subtests.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
							<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
								<FileTextIcon className="size-6 text-muted-foreground" />
							</div>
							<h3 className="font-semibold">Belum ada subtest</h3>
							<p className="mt-1 mb-6 max-w-sm text-muted-foreground text-sm">
								Tryout ini belum memiliki subtest. Tambahkan subtest untuk mulai membuat soal dan mengatur durasi
								pengerjaan.
							</p>
							<Button onClick={() => setIsAddDialogOpen(true)}>
								<PlusIcon className="mr-2 size-4" />
								Buat Subtest Pertama
							</Button>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/50 hover:bg-muted/50">
										<TableHead className="w-12 text-center">No</TableHead>
										<TableHead>Nama Subtest</TableHead>
										<TableHead className="w-24">Durasi</TableHead>
										<TableHead className="w-32">Urutan Soal</TableHead>
										<TableHead className="w-20 text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{subtests.map((subtest, index) => (
										<TableRow key={subtest.id} className="group">
											<TableCell className="text-center">
												<div className="mx-auto flex size-6 items-center justify-center rounded-full bg-muted font-medium font-mono text-xs">
													{index + 1}
												</div>
											</TableCell>
											<TableCell>
												<Link
													to="/admin/tryouts/$tryoutId/subtests/$subtestId"
													params={{
														tryoutId: tryoutId.toString(),
														subtestId: subtest.id.toString(),
													}}
													className="group/link block"
												>
													<span className="font-medium group-hover/link:underline">{subtest.name}</span>
													{subtest.description && (
														<p className="line-clamp-1 text-muted-foreground text-xs">{subtest.description}</p>
													)}
												</Link>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5">
													<ClockIcon className="size-3.5 text-muted-foreground" />
													<span>{subtest.duration} menit</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={subtest.questionOrder === "random" ? "secondary" : "outline"}
													className="text-xs"
												>
													{subtest.questionOrder === "random" ? "Acak" : "Berurutan"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<AlertDialog
													open={deleteDialogOpen === subtest.id}
													onOpenChange={(open) => setDeleteDialogOpen(open ? subtest.id : null)}
												>
													<AlertDialogTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="text-muted-foreground opacity-0 hover:text-red-600 group-hover:opacity-100"
														>
															<TrashIcon className="size-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Hapus Subtest</AlertDialogTitle>
															<AlertDialogDescription>
																Apakah Anda yakin ingin menghapus subtest "{subtest.name}"? Tindakan ini tidak dapat
																dibatalkan dan semua soal di dalamnya akan terhapus.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Batal</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDelete(subtest.id)}
																className="bg-red-600 hover:bg-red-700"
															>
																{deleteMutation.isPending ? "Menghapus..." : "Hapus"}
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<AddSubtestDialog
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				onSuccess={onUpdate}
				tryoutId={tryoutId}
			/>
		</div>
	);
}
