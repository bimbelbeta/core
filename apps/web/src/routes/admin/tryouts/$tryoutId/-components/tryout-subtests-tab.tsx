import { ClockIcon, FileTextIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/admin-page";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
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

import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { AddSubtestDialog } from "./add-subtest-dialog";
import { SubtestDetailPanel } from "./subtest-detail-panel";

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
		questionCount: number;
	}[];
	onUpdate: () => void;
}

export function TryoutSubtestsTab({ tryoutId, subtests, onUpdate }: TryoutSubtestsTabProps) {
	const { subtest: selectedSubtestId } = useSearch({ from: "/admin/tryouts/$tryoutId/" });
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

	const deleteMutation = useMutation(
		orpc.admin.tryout.subtest.remove.mutationOptions({
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
	const selectedSubtest = subtests.find((subtest) => subtest.id === selectedSubtestId);

	if (selectedSubtest) {
		return (
			<SubtestDetailPanel key={selectedSubtest.id} tryoutId={tryoutId} subtest={selectedSubtest} onUpdate={onUpdate} />
		);
	}

	return (
		<div className="space-y-4">
			<AdminSection
				title="Daftar subtest"
				description={
					subtests.length === 0
						? "Belum ada subtest. Tambahkan subtest untuk mulai membuat soal."
						: `Kelola ${subtests.length} subtest dalam tryout ini.`
				}
			>
				{subtests.length > 0 && (
					<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
						<ClockIcon className="size-3.5" />
						<span>Total durasi: {totalDuration} menit</span>
					</div>
				)}

				{subtests.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
						<div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
							<FileTextIcon className="text-muted-foreground size-6" />
						</div>
						<Typography variant="subtitle2">Belum ada subtest</Typography>
						<Typography variant="body" tone="muted" className="mt-1 mb-6 max-w-sm">
							Tryout ini belum memiliki subtest. Tambahkan subtest untuk mulai membuat soal dan mengatur durasi
							pengerjaan.
						</Typography>
						<Button size="xs" onClick={() => setIsAddDialogOpen(true)}>
							<PlusIcon className="size-3.5" />
							Buat Subtest Pertama
						</Button>
					</div>
				) : (
					<AdminTableRoot>
						<AdminTable>
							<AdminTableHeader>
								<AdminTableHead>Nama subtest</AdminTableHead>
								<AdminTableHead className="w-24 text-right">Soal</AdminTableHead>
								<AdminTableHead className="w-28 text-right">Durasi (menit)</AdminTableHead>
								<AdminTableHead className="hidden w-32 sm:table-cell">Urutan soal</AdminTableHead>
								<AdminTableHead className="w-16 text-right">
									<span className="sr-only">Aksi</span>
								</AdminTableHead>
							</AdminTableHeader>
							<AdminTableBody columns={5}>
								{subtests.map((subtest) => (
									<AdminTableRow key={subtest.id} className="group">
										<AdminTableCell>
											<Link
												to="/admin/tryouts/$tryoutId"
												params={{ tryoutId: tryoutId.toString() }}
												search={{ tab: "subtests", subtest: subtest.id }}
												className="group/link focus-visible:ring-ring/50 block rounded-sm outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline focus-visible:ring-2"
											>
												<span className="text-row-title group-hover/link:underline">{subtest.name}</span>
												{subtest.description && (
													<Typography variant="caption" className="line-clamp-1">
														{subtest.description}
													</Typography>
												)}
											</Link>
										</AdminTableCell>
										<AdminTableCell className="text-meta text-right tabular-nums">
											{subtest.questionCount}
										</AdminTableCell>
										<AdminTableCell className="text-meta text-right tabular-nums">{subtest.duration}</AdminTableCell>
										<AdminTableCell className="hidden sm:table-cell">
											<Badge variant="outline" className="font-normal">
												{subtest.questionOrder === "random" ? "Acak" : "Berurutan"}
											</Badge>
										</AdminTableCell>
										<AdminTableCell className="relative z-10 text-right">
											<AlertDialog
												open={deleteDialogOpen === subtest.id}
												onOpenChange={(open) => setDeleteDialogOpen(open ? subtest.id : null)}
											>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														aria-label={`Hapus subtest ${subtest.name}`}
														className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:text-red-600"
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
															isPending={deleteMutation.isPending}
															onClick={() => handleDelete(subtest.id)}
															variant="destructive"
														>
															Hapus
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</AdminTableCell>
									</AdminTableRow>
								))}
							</AdminTableBody>
						</AdminTable>
					</AdminTableRoot>
				)}

				{subtests.length > 0 && (
					<div className="flex items-center justify-end gap-1">
						<Button size="xs" onClick={() => setIsAddDialogOpen(true)}>
							<PlusIcon className="size-3.5" />
							Tambah subtest
						</Button>
					</div>
				)}
			</AdminSection>

			<AddSubtestDialog
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				onSuccess={onUpdate}
				tryoutId={tryoutId}
			/>
		</div>
	);
}
