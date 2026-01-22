import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { SubjectListItem } from "@/components/classes/classes-types";
import { NotFoundContentState } from "@/components/classes/not-found-content-state";
import { SubjectFilters } from "@/components/classes/subject-filters";
import { SubjectHeader } from "@/components/classes/subject-header";
import { SubjectList } from "@/components/classes/subject-list";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { createMeta } from "@/lib/seo-utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/classes/")({
	head: () => ({
		meta: createMeta({
			title: "Kelas",
			description: "Upgrade ke premium untuk akses penuh ke semua fitur dan materi bimbelbeta.",
			noIndex: true,
		}),
	}),
	component: RouteComponent,
});

type Search = {
	q?: string;
	category?: "sd" | "smp" | "sma" | "utbk" | undefined;
};

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const userRole = session?.user?.role;
	const isAdmin = userRole === "admin";

	const searchParams = Route.useSearch();
	const searchQuery = (searchParams as Search).q ?? "";
	const activeFilter: "all" | "sd" | "smp" | "sma" | "utbk" = (searchParams as Search).category ?? "all";

	const navigate = Route.useNavigate();
	const updateSearch = (updates: Partial<Search>) => {
		const newSearch: Partial<Search> = {};

		if (updates.q !== undefined) {
			newSearch.q = updates.q || undefined;
		}
		if (updates.category !== undefined) {
			newSearch.category = updates.category || undefined;
		}

		const cleanSearch = Object.fromEntries(Object.entries(newSearch).filter(([, value]) => value !== undefined));

		navigate({ search: cleanSearch });
	};

	const subjectsQuery = useQuery({
		...orpc.subject.listSubjects.queryOptions({
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

				{subjectsQuery.data && subjectsQuery.data.length === 0 && (
					<NotFoundContentState
						title="Tidak ada kelas yang ditemukan"
						desc="Coba cari dengan kata kunci lain atau hubungi admin."
					/>
				)}

				{subjectsQuery.data && subjectsQuery.data.length > 0 && (
					<SubjectList
						items={subjectsQuery.data as SubjectListItem[]}
						isLoading={subjectsQuery.isPending}
						error={subjectsQuery.isError ? subjectsQuery.error.message : undefined}
						searchQuery={searchQuery}
						onCreate={isAdmin ? () => {} : undefined}
					/>
				)}
			</div>
		</div>
	);
}
