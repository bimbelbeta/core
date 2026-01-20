import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ClassHeader } from "@/components/classes/class-header";
import { ContentList } from "@/components/classes/content-list";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/classes/$subjectId/")({
	params: {
		parse: (raw) => ({
			subjectId: Number(raw.subjectId),
		}),
	},
	component: RouteComponent,
});

type Search = {
	q?: string;
	page?: number;
};

function RouteComponent() {
	const { subjectId } = Route.useParams();
	const session = authClient.useSession();
	const userIsPremium = session.data?.user?.isPremium ?? false;
	const userRole = session.data?.user?.role;

	const searchParams = Route.useSearch();
	const searchQuery = (searchParams as Search).q ?? "";
	const page = (searchParams as Search).page ?? 0;

	const navigate = Route.useNavigate();
	const updateSearch = (updates: Partial<Search>) => {
		const newSearch: Partial<Search> = {};

		if (updates.q !== undefined) {
			newSearch.q = updates.q || undefined;
		}
		if (updates.page !== undefined) {
			newSearch.page = updates.page;
		}

		if (updates.q !== undefined && updates.q !== (searchParams as Search).q) {
			newSearch.page = 0;
		}

		// Remove undefined values to avoid ?q=undefined in URL
		const cleanSearch = Object.fromEntries(Object.entries(newSearch).filter(([, value]) => value !== undefined));

		navigate({ search: cleanSearch });
	};

	const contents = useQuery({
		...orpc.subject.listContentBySubjectCategory.queryOptions({
			input: {
				subjectId: Number(subjectId),
				search: searchQuery || undefined,
				limit: 20,
				offset: page * 20,
			},
		}),
		placeholderData: (previousData) => previousData,
		staleTime: 1000 * 60 * 5,
	});

	const trackSubjectViewMutation = useMutation(orpc.subject.trackSubjectView.mutationOptions());

	// Track subject view when content loads successfully
	useEffect(() => {
		if (contents.data?.subject?.id) {
			trackSubjectViewMutation.mutate({ subjectId: contents.data.subject.id });
		}
	}, [contents.data?.subject?.id, trackSubjectViewMutation.mutate]);

	if (contents.isPending) {
		return (
			<Container className="space-y-6">
				<Skeleton className="h-70 w-full" />
			</Container>
		);
	}

	if (contents.isError) {
		return (
			<Container className="pt-12">
				<p className="text-red-500 text-sm">Error: {contents.error.message}</p>
			</Container>
		);
	}
	if (!contents.data) return notFound();

	console.log(contents.data.subject);

	return (
		<div className="-mt-5 space-y-4 sm:-mt-3">
			<ClassHeader subject={contents.data.subject} />

			{/* Since search is admin only feature */}
			{/*<div className="space-y-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="max-w-md flex-1">
						<SearchInput value={searchQuery} onChange={(q) => updateSearch({ q })} placeholder="Cari konten..." />
					</div>
				</div>
			</div>*/}

			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/classes">Kelas</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem className="uppercase">
						<BreadcrumbLink href={`/classes/?category=${contents.data.subject.category}`}>
							{contents.data.subject.category}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href={`/classes/${contents.data.subject.id}`}>{contents.data.subject.name}</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="space-y-4">
				<ContentList
					items={contents.data.items}
					isLoading={contents.isPending}
					error={undefined}
					searchQuery={searchQuery}
					showCount={Boolean(searchQuery)}
					hasMore={contents.data.items?.length === 20}
					onLoadMore={() => updateSearch({ page: page + 1 })}
					userIsPremium={userIsPremium}
					userRole={userRole}
					subjectId={Number(subjectId)}
				/>
			</div>
		</div>
	);
}
