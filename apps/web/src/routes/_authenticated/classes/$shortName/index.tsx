import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ClassHeader } from "@/components/classes/class-header";
import { ContentFilters } from "@/components/classes/content-filters";
import { ContentList } from "@/components/classes/content-list";
// import { ClassHeader, ContentFilters, ContentList } from "@/components/classes";
import { Container } from "@/components/ui/container";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/classes/$shortName/")({
	params: {
		parse: (raw) => ({
			shortName: raw.shortName?.toLowerCase(),
		}),
	},
	component: RouteComponent,
});

type Search = {
	q?: string;
	category?: "material" | "tips_and_trick" | undefined;
	page?: number;
};

function RouteComponent() {
	const { shortName } = Route.useParams();
	const session = authClient.useSession();
	const userIsPremium = session.data?.user?.isPremium ?? false;
	const userRole = session.data?.user?.role;

	const searchParams = Route.useSearch();
	const searchQuery = (searchParams as Search).q ?? "";
	const activeFilter: "all" | "material" | "tips_and_trick" = (searchParams as Search).category ?? "all";
	const page = (searchParams as Search).page ?? 0;

	const navigate = Route.useNavigate();
	const updateSearch = (updates: Partial<Search>) => {
		const newSearch: Partial<Search> = {};

		if (updates.q !== undefined) {
			newSearch.q = updates.q || undefined;
		}
		if (updates.category !== undefined) {
			newSearch.category = updates.category || undefined;
		}
		if (updates.page !== undefined) {
			newSearch.page = updates.page;
		}

		if (
			(updates.q !== undefined && updates.q !== (searchParams as Search).q) ||
			(updates.category !== undefined && updates.category !== (searchParams as Search).category)
		) {
			newSearch.page = 0;
		}

		// Remove undefined values to avoid ?category=undefined in URL
		const cleanSearch = Object.fromEntries(Object.entries(newSearch).filter(([, value]) => value !== undefined));

		navigate({ search: cleanSearch });
	};

	const subtests = useQuery(orpc.subject.listSubjects.queryOptions());
	const matchedSubject = subtests.data?.find((item) => item.shortName?.toLowerCase() === shortName);

	const contents = useQuery(
		orpc.subject.listContentBySubjectCategory.queryOptions({
			input: (() => {
				const input: {
					subjectId: number;
					category?: "material" | "tips_and_trick";
					search?: string;
					limit: number;
					offset: number;
				} = {
					subjectId: matchedSubject?.id ?? 0,
					limit: 20,
					offset: page * 20,
				};
				if (activeFilter !== "all") {
					input.category = activeFilter as "material" | "tips_and_trick";
				}
				if (searchQuery) {
					input.search = searchQuery;
				}
				return input;
			})(),
			enabled: Boolean(matchedSubject?.id),
		}),
	);

	if (subtests.isPending) {
		return (
			<Container className="space-y-6">
				<Skeleton className="h-70 w-full" />
			</Container>
		);
	}

	if (subtests.isError) {
		return (
			<Container className="pt-12">
				<p className="text-red-500 text-sm">Error: {subtests.error.message}</p>
			</Container>
		);
	}
	if (!matchedSubject) return notFound();

	return (
		<div className="-mt-5 space-y-4 sm:-mt-3">
			<ClassHeader subject={matchedSubject} />
			<div className="space-y-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<ContentFilters
						activeFilter={activeFilter}
						onChange={(category) =>
							updateSearch({ category: category === "all" ? undefined : (category as "material" | "tips_and_trick") })
						}
					/>
					<div className="max-w-md flex-1">
						<SearchInput value={searchQuery} onChange={(q) => updateSearch({ q })} placeholder="Cari konten..." />
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<ContentList
					items={contents.data}
					isLoading={contents.isPending}
					error={contents.isError ? contents.error.message : undefined}
					searchQuery={searchQuery}
					showCount={Boolean(searchQuery)}
					hasMore={contents.data?.length === 20}
					onLoadMore={() => updateSearch({ page: page + 1 })}
					userIsPremium={userIsPremium}
					userRole={userRole}
					shortName={shortName}
				/>
			</div>
		</div>
	);
}
