import { ROLES } from "@bimbelbeta/contract/common/roles";
import { DotsThreeIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
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
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import type { SubjectFilter, SubjectListItem } from "@/components/classes/classes-types";
import { CreateSubjectDialog } from "@/components/classes/create-subject-dialog";
import { DeleteSubjectDialog } from "@/components/classes/delete-subject-dialog";
import { EditSubjectDialog } from "@/components/classes/edit-subject-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { gradeLabel } from "@/lib/formatter";
import { orpc } from "@/lib/orpc";
import { SUBJECT_CATEGORY_LABELS, type SubjectCategory, subjectCategorySchema } from "@/lib/schemas";
import { createMeta } from "@/lib/seo-utils";

const searchSchema = type({
	"q?": "string",
	"category?": subjectCategorySchema,
});

export const Route = createFileRoute("/admin/classes/")({
	staticData: { breadcrumb: "Kelas" },
	head: () => ({
		meta: createMeta({
			title: "Kelas",
			description: "Upgrade ke premium untuk akses penuh ke semua fitur dan materi bimbelbeta.",
			noIndex: true,
		}),
	}),
	component: RouteComponent,
	validateSearch: searchSchema,
});

function RouteComponent() {
	const [createOpen, setCreateOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<SubjectListItem | null>(null);
	const [deletingSubject, setDeletingSubject] = useState<SubjectListItem | null>(null);
	const { session } = Route.useRouteContext();
	const userRole = session?.user?.role;
	const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;

	const { q = "", category } = Route.useSearch();
	const searchQuery = q;
	const activeFilter: SubjectFilter = category ?? "all";
	const hasFilters = Boolean(searchQuery || category);

	const navigate = Route.useNavigate();
	const updateSearch = (updates: { q?: string; category?: SubjectCategory }) => {
		navigate({
			search: {
				q: "q" in updates ? updates.q || undefined : q || undefined,
				category: "category" in updates ? updates.category : category,
			},
		});
	};

	const subjectsQuery = useQuery({
		...orpc.subject.list.queryOptions({
			input: {
				category: activeFilter === "all" ? undefined : activeFilter,
				search: searchQuery || undefined,
			},
		}),
		placeholderData: (previousData) => previousData,
		staleTime: 1000 * 60 * 5,
	});

	const items = subjectsQuery.data?.items ?? [];

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Kelas</Typography>
					{subjectsQuery.data && (
						<Typography variant="body" tone="muted">
							{items.length} subject
						</Typography>
					)}
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					{isAdmin && (
						<Button size="sm" className="h-9" onClick={() => setCreateOpen(true)}>
							<PlusIcon className="size-4" />
							Tambah Subject
						</Button>
					)}
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableToolbar
					searchValue={searchQuery}
					onSearchChange={(value) => updateSearch({ q: value })}
					searchPlaceholder="Cari kelas..."
					onReset={hasFilters ? () => updateSearch({ q: undefined, category: undefined }) : undefined}
				>
					<Select
						value={activeFilter}
						onValueChange={(value) =>
							updateSearch({ category: value === "all" ? undefined : (value as SubjectCategory) })
						}
					>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="Semua Kelas" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Kelas</SelectItem>
							{Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</AdminTableToolbar>

				<AdminTableRoot>
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHead className="pl-4">Subject</AdminTableHead>
							<AdminTableHead className="hidden w-32 sm:table-cell">Kategori</AdminTableHead>
							<AdminTableHead className="hidden w-36 sm:table-cell">Dibuka</AdminTableHead>
							<AdminTableHead className="pr-4 text-right">Aksi</AdminTableHead>
						</AdminTableHeader>
						<AdminTableBody
							isLoading={subjectsQuery.isPending && !subjectsQuery.data}
							isError={subjectsQuery.isError}
							onRetry={() => subjectsQuery.refetch()}
							isEmpty={!subjectsQuery.isPending && !subjectsQuery.isError && items.length === 0}
							emptyMessage={hasFilters ? "Tidak ada kelas yang cocok dengan filter ini." : "Belum ada kelas."}
							emptyAction={
								isAdmin && !hasFilters ? (
									<Button size="sm" onClick={() => setCreateOpen(true)}>
										<PlusIcon className="size-4" />
										Tambah Subject
									</Button>
								) : undefined
							}
							columns={4}
						>
							{items.map((subject) => (
								<AdminTableRow key={subject.id}>
									<AdminTableCell className="pl-4">
										<div className="min-w-0">
											<Link
												to={isAdmin ? "/admin/classes/$subjectId" : "/classes/$subjectId"}
												params={{ subjectId: subject.id.toString() }}
												className="text-row-title text-foreground hover:text-primary focus-visible:text-primary focus-visible:ring-ring/50 line-clamp-2 rounded-sm whitespace-normal underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline focus-visible:ring-2"
											>
												{subject.name}
											</Link>
											<div className="text-muted-foreground text-meta mt-1">
												{gradeLabel(subject.category, subject.gradeLevel)}
											</div>
										</div>
									</AdminTableCell>
									<AdminTableCell className="hidden sm:table-cell">
										<Badge variant="outline" className="font-normal uppercase">
											{subject.category}
										</Badge>
									</AdminTableCell>
									<AdminTableCell className="text-muted-foreground hidden text-sm sm:table-cell">
										{subject.hasViewed ? "Sudah dibuka" : "—"}
									</AdminTableCell>
									<AdminTableCell className="relative z-10 pr-4 text-right">
										<div className="flex items-center justify-end">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" aria-label={`Aksi untuk ${subject.name}`}>
														<DotsThreeIcon className="size-5" weight="bold" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link to="/admin/classes/$subjectId" params={{ subjectId: subject.id.toString() }}>
															Buka subject
														</Link>
													</DropdownMenuItem>
													{isAdmin && (
														<DropdownMenuItem onSelect={() => setEditingSubject(subject)}>
															<PencilSimpleIcon className="size-4" /> Edit subject
														</DropdownMenuItem>
													)}
													{isAdmin && (
														<DropdownMenuItem variant="destructive" onSelect={() => setDeletingSubject(subject)}>
															<TrashIcon className="size-4" /> Hapus subject
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</AdminTableCell>
								</AdminTableRow>
							))}
						</AdminTableBody>
					</AdminTable>
				</AdminTableRoot>
			</AdminPageContent>

			{isAdmin && (
				<>
					<CreateSubjectDialog
						open={createOpen}
						onOpenChange={setCreateOpen}
						defaultCategory={activeFilter === "all" ? undefined : activeFilter}
					/>
					{editingSubject && (
						<EditSubjectDialog
							open={!!editingSubject}
							onOpenChange={(open) => {
								if (!open) setEditingSubject(null);
							}}
							subject={editingSubject}
						/>
					)}
					{deletingSubject && (
						<DeleteSubjectDialog
							open={!!deletingSubject}
							onOpenChange={(open) => {
								if (!open) setDeletingSubject(null);
							}}
							subject={deletingSubject}
						/>
					)}
				</>
			)}
		</AdminPageRoot>
	);
}
