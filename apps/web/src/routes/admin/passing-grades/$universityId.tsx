import { ArrowLeftIcon, DotsThreeIcon, PencilIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orpc } from "@/utils/orpc";
import { AddProgramDialog } from "./-components/add-program-dialog";
import { DeleteProgramAlert } from "./-components/delete-program-alert";
import { EditProgramDialog } from "./-components/edit-program-dialog";

export const Route = createFileRoute("/admin/passing-grades/$universityId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { universityId } = Route.useParams();
	const queryClient = useQueryClient();
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	type ProgramData = {
		id: number;
		studyProgram: {
			id: number;
			name: string;
			category: string | null;
		};
		tuition: number | null;
		capacity: number | null;
		accreditation: string | null;
		isActive: boolean;
	};
	const [editProgram, setEditProgram] = useState<ProgramData | null>(null);
	const [deleteProgram, setDeleteProgram] = useState<ProgramData | null>(null);

	const { data: university, isLoading: isUniversityLoading } = useQuery(
		orpc.admin.university.universities.find.queryOptions({
			input: {
				id: Number(universityId),
			},
		}),
	);

	const { data: programs, isPending: isProgramsLoading } = useQuery(
		orpc.admin.university.universityPrograms.list.queryOptions({
			input: {
				universityId: Number(universityId),
				limit: 100,
			},
		}),
	);

	if (isUniversityLoading) {
		return <div className="p-6">Memuat...</div>;
	}

	if (!university) {
		return <div className="p-6">Universitas tidak ditemukan</div>;
	}

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admin/passing-grades">
						<ArrowLeftIcon className="size-5" />
					</Link>
				</Button>
				<div className="flex flex-col">
					<h1 className="font-bold text-2xl text-primary-navy-900">{university.name}</h1>
					<span className="text-muted-foreground">{university.location}</span>
				</div>
			</div>

			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Program Studi</h2>
				<AddProgramDialog
					universityId={Number(universityId)}
					onSuccess={() => {
						setIsAddDialogOpen(false);
						queryClient.invalidateQueries({
							queryKey: orpc.admin.university.universityPrograms.list.queryKey({
								input: {
									universityId: Number(universityId),
								},
							}),
						});
					}}
					open={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
				/>
			</div>

			<div className="overflow-clip rounded-lg border bg-white shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>No</TableHead>
							<TableHead>Nama Program</TableHead>
							<TableHead>Kategori</TableHead>
							<TableHead>Biaya</TableHead>
							<TableHead>Kapasitas</TableHead>
							<TableHead>Akreditasi</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isProgramsLoading ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center">
									Memuat program...
								</TableCell>
							</TableRow>
						) : !programs?.data || programs.data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
									Belum ada program studi yang ditautkan.
								</TableCell>
							</TableRow>
						) : (
							programs.data.map((prog, index) => (
								<TableRow key={prog.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className="font-medium">{prog.studyProgram.name}</TableCell>
									<TableCell>{prog.studyProgram.category}</TableCell>
									<TableCell>{prog.tuition ? `Rp ${prog.tuition.toLocaleString("id-ID")}` : "-"}</TableCell>
									<TableCell>{prog.capacity ?? "-"}</TableCell>
									<TableCell>{prog.accreditation ?? "-"}</TableCell>
									<TableCell>
										<Badge variant={prog.isActive ? "default" : "secondary"}>
											{prog.isActive ? "Aktif" : "Tidak Aktif"}
										</Badge>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon">
													<DotsThreeIcon className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => setEditProgram(prog)}>
													<PencilIcon className="mr-2 size-4" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem variant="destructive" onClick={() => setDeleteProgram(prog)}>
													<TrashIcon className="mr-2 size-4" />
													Hapus
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{editProgram && (
				<Dialog
					open={!!editProgram}
					onOpenChange={(open) => {
						if (!open) setEditProgram(null);
					}}
				>
					<DialogContent className="sm:max-w-150">
						<DialogHeader>
							<DialogTitle>Edit Program Studi</DialogTitle>
						</DialogHeader>
						<EditProgramDialog
							universityProgram={editProgram}
							onSuccess={() => {
								queryClient.invalidateQueries({
									queryKey: orpc.admin.university.universityPrograms.list.queryKey({
										input: {
											universityId: Number(universityId),
										},
									}),
								});
								setEditProgram(null);
							}}
							onOpenChange={(open) => {
								if (!open) setEditProgram(null);
							}}
						/>
					</DialogContent>
				</Dialog>
			)}

			<DeleteProgramAlert
				universityProgram={deleteProgram!}
				onSuccess={() => {
					queryClient.invalidateQueries({
						queryKey: orpc.admin.university.universityPrograms.list.queryKey({
							input: {
								universityId: Number(universityId),
							},
						}),
					});
				}}
				open={!!deleteProgram}
				onOpenChange={(open) => {
					if (!open) setDeleteProgram(null);
				}}
			/>
		</div>
	);
}
