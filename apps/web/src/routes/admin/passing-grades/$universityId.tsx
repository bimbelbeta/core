import { ArrowLeftIcon, DotsThreeIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminSection,
} from "@/components/admin/admin-page";
import {
	AdminTable,
	AdminTableBody,
	AdminTableCell,
	AdminTableHead,
	AdminTableHeader,
	AdminTableRoot,
	AdminTableRow,
} from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { formatRupiah } from "@/lib/formatter";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { AddProgramDialog } from "./-components/add-program-dialog";
import { DeleteProgramAlert } from "./-components/delete-program-alert";
import { EditProgramDialog } from "./-components/edit-program-dialog";

export const Route = createFileRoute("/admin/passing-grades/$universityId")({
	staticData: {
		breadcrumb: "Detail universitas",
		breadcrumbParent: { label: "Passing grade", to: "/admin/passing-grades" },
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { universityId: rawUniversityId } = Route.useParams();
	const universityId = parseRouteParamToNumber(rawUniversityId);
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
		averageScore: number | null;
		isActive: boolean;
	};
	const [editProgram, setEditProgram] = useState<ProgramData | null>(null);
	const [deleteProgramId, setDeleteProgramId] = useState<number | null>(null);

	const { data: university, isLoading: isUniversityLoading } = useQuery(
		orpc.admin.university.universities.find.queryOptions({
			input: {
				id: universityId,
			},
		}),
	);

	const { data: programs, isPending: isProgramsLoading } = useQuery(
		orpc.admin.university.universityPrograms.list.queryOptions({
			input: {
				universityId: universityId,
				limit: 100,
			},
		}),
	);

	if (isUniversityLoading) {
		return (
			<AdminPageRoot>
				<AdminPageContent>
					<div className="flex items-center gap-2">
						<Skeleton className="size-8 rounded-full" />
						<div className="flex flex-col gap-1">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-4 w-56" />
						</div>
					</div>
				</AdminPageContent>
			</AdminPageRoot>
		);
	}

	if (!university) {
		return (
			<AdminPageRoot>
				<AdminPageContent>
					<Typography>Universitas tidak ditemukan</Typography>
				</AdminPageContent>
			</AdminPageRoot>
		);
	}

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" asChild>
							<Link to="/admin/passing-grades" aria-label="Kembali">
								<ArrowLeftIcon className="size-4" />
							</Link>
						</Button>
						<Typography variant="title">{university.name}</Typography>
					</div>
					<Typography variant="body" tone="muted">
						{university.location}
					</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<AddProgramDialog
						universityId={universityId}
						onSuccess={() => {
							setIsAddDialogOpen(false);
							queryClient.invalidateQueries({
								queryKey: orpc.admin.university.universityPrograms.list.queryKey({
									input: {
										universityId: universityId,
									},
								}),
							});
						}}
						open={isAddDialogOpen}
						onOpenChange={setIsAddDialogOpen}
					/>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminSection title="Program studi">
					<AdminTableRoot>
						<AdminTable className="min-w-[800px]">
							<AdminTableHeader>
								<AdminTableHead className="pl-3">Program studi</AdminTableHead>
								<AdminTableHead className="w-28">Kategori</AdminTableHead>
								<AdminTableHead className="hidden w-24 text-right sm:table-cell">Skor rata-rata</AdminTableHead>
								<AdminTableHead className="hidden w-32 text-right md:table-cell">Biaya</AdminTableHead>
								<AdminTableHead className="hidden w-24 text-right md:table-cell">Kapasitas</AdminTableHead>
								<AdminTableHead className="hidden w-28 sm:table-cell">Akreditasi</AdminTableHead>
								<AdminTableHead className="w-24">Status</AdminTableHead>
								<AdminTableHead className="w-16 pr-3 text-right">
									<span className="sr-only">Aksi</span>
								</AdminTableHead>
							</AdminTableHeader>
							<AdminTableBody
								isLoading={isProgramsLoading}
								isEmpty={!isProgramsLoading && (!programs?.items || programs.items.length === 0)}
								emptyMessage="Belum ada program studi yang ditautkan."
								columns={8}
							>
								{programs?.items.map((prog) => (
									<AdminTableRow key={prog.id}>
										<AdminTableCell className="pl-3">
											<Button
												type="button"
												variant="link"
												size="none"
												onClick={() => setEditProgram(prog)}
												className="focus-visible:ring-ring/50 after:absolute after:inset-0 after:content-[''] focus-visible:ring-2"
											>
												{prog.studyProgram.name}
											</Button>
										</AdminTableCell>
										<AdminTableCell className="text-meta">{prog.studyProgram.category ?? "—"}</AdminTableCell>
										<AdminTableCell className="hidden text-right sm:table-cell">
											<span className="text-sm font-semibold tabular-nums">{prog.averageScore}</span>
										</AdminTableCell>
										<AdminTableCell className="hidden text-right md:table-cell">
											<span className="text-sm tabular-nums">{prog.tuition ? formatRupiah(prog.tuition) : "—"}</span>
										</AdminTableCell>
										<AdminTableCell className="hidden text-right md:table-cell">
											<span className="text-sm tabular-nums">{prog.capacity ?? "—"}</span>
										</AdminTableCell>
										<AdminTableCell className="text-meta hidden sm:table-cell">
											{prog.accreditation ?? "—"}
										</AdminTableCell>
										<AdminTableCell>
											<Badge variant={prog.isActive ? "info" : "secondary"}>
												{prog.isActive ? "Aktif" : "Tidak Aktif"}
											</Badge>
										</AdminTableCell>
										<AdminTableCell className="relative z-10 pr-3 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														aria-label={`Aksi program studi ${prog.studyProgram.name}`}
													>
														<DotsThreeIcon className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem variant="destructive" onClick={() => setDeleteProgramId(prog.id)}>
														<TrashIcon className="mr-2 size-4" />
														Hapus
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</AdminTableCell>
									</AdminTableRow>
								))}
							</AdminTableBody>
						</AdminTable>
					</AdminTableRoot>
				</AdminSection>
			</AdminPageContent>

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
											universityId: universityId,
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
				id={deleteProgramId!}
				onSuccess={() => {
					queryClient.invalidateQueries({
						queryKey: orpc.admin.university.universityPrograms.list.queryKey({
							input: {
								universityId: universityId,
							},
						}),
					});
				}}
				open={!!deleteProgramId}
				onOpenChange={(open) => {
					if (!open) setDeleteProgramId(null);
				}}
			/>
		</AdminPageRoot>
	);
}
