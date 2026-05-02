import { ROLES } from "@bimbelbeta/contract/common/roles";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import type { SubjectCategory, SubjectFilter } from "@/components/classes/classes-types";
import { CreateSubjectDialog } from "@/components/classes/create-subject-dialog";
import { NotFoundContentState } from "@/components/classes/not-found-content-state";
import { SubjectFilters } from "@/components/classes/subject-filters";
import { SubjectHeader } from "@/components/classes/subject-header";
import { SubjectList } from "@/components/classes/subject-list";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { createMeta } from "@/lib/seo-utils";
import { orpc } from "@/utils/orpc";

const searchSchema = type({
	"q?": "string",
	"category?": "'sd' | 'smp' | 'sma' | 'utbk'",
});

export const Route = createFileRoute("/_authenticated/classes/")({
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
	const { session } = Route.useRouteContext();
	const userRole = session?.user?.role;
	const isAdmin = userRole === ROLES.ADMIN;

	const { q = "", category } = Route.useSearch();
	const searchQuery = q;
	const activeFilter: SubjectFilter = category ?? "all";

	const navigate = Route.useNavigate();
	const updateSearch = (updates: { q?: string; category?: SubjectCategory }) => {
		navigate({ search: { q: updates.q ?? undefined, category: updates.category ?? undefined } });
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

	return (
		<div className="-mt-5 sm:-mt-3">
			<SubjectHeader />

			{/*<hr className="my-3 sm:my-4" />*/}

			<div className="my-3 space-y-4 sm:my-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<SubjectFilters
						activeFilter={activeFilter}
						onChange={(category) => updateSearch({ category: category === "all" ? undefined : category })}
					/>
					<div className="max-w-md flex-1">
						<SearchInput value={searchQuery} onChange={(q) => updateSearch({ q })} placeholder="Cari kelas..." />
					</div>
				</div>
			</div>

			<div>
				{!subjectsQuery.data && subjectsQuery.isPending && (
					<div className="flex h-full flex-col gap-2 sm:gap-5">
						{Array.from({ length: 9 }).map((_, i) => (
							<Skeleton key={i.toString()} className="h-40 w-full" />
						))}
					</div>
				)}

				{subjectsQuery.isError && <p className="text-red-500">Error: {subjectsQuery.error.message}</p>}

				{subjectsQuery.data && subjectsQuery.data.items.length === 0 && (
					<NotFoundContentState
						title="Tidak ada kelas yang ditemukan"
						desc="Coba cari dengan kata kunci lain atau hubungi admin."
					/>
				)}

				{subjectsQuery.data && subjectsQuery.data.items.length > 0 && (
					<SubjectList
						items={subjectsQuery.data.items}
						isLoading={subjectsQuery.isPending}
						error={subjectsQuery.isError ? subjectsQuery.error.message : undefined}
						searchQuery={searchQuery}
					/>
				)}
			</div>
			{isAdmin && (
				<CreateSubjectDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					defaultCategory={activeFilter === "all" ? undefined : activeFilter}
				/>
			)}
		</div>
	);
}
