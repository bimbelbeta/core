import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
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

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Daftar Subtest</CardTitle>
						<CardDescription>Kelola subtest yang ada dalam tryout ini.</CardDescription>
					</div>
					<Button onClick={() => setIsAddDialogOpen(true)}>
						<PlusIcon className="mr-2 size-4" />
						Tambah Subtest
					</Button>
				</CardHeader>
				<CardContent>
					{subtests.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
							<p>Belum ada subtest.</p>
							<Button variant="link" onClick={() => setIsAddDialogOpen(true)}>
								Buat subtest baru
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12 text-center">No</TableHead>
									<TableHead>Nama</TableHead>
									<TableHead>Durasi</TableHead>
									<TableHead>Urutan Soal</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{subtests.map((subtest, index) => (
									<TableRow key={subtest.id} className="group hover:bg-muted/30">
										<TableCell className="text-center font-mono text-muted-foreground text-sm">{index + 1}</TableCell>
										<TableCell className="font-medium">
											<Link
												to="/admin/tryouts/$tryoutId/subtests/$subtestId"
												params={{ tryoutId: tryoutId.toString(), subtestId: subtest.id.toString() }}
												className="hover:underline"
											>
												{subtest.name}
											</Link>
											{subtest.description && (
												<p className="line-clamp-1 text-muted-foreground text-xs">{subtest.description}</p>
											)}
										</TableCell>
										<TableCell>{subtest.duration} menit</TableCell>
										<TableCell>{subtest.questionOrder === "random" ? "Acak" : "Berurutan"}</TableCell>
										<TableCell className="text-right">
											<AlertDialog
												open={deleteDialogOpen === subtest.id}
												onOpenChange={(open) => setDeleteDialogOpen(open ? subtest.id : null)}
											>
												<AlertDialogTrigger asChild>
													<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600">
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
