import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SubjectCard } from "@/components/classes/subject-card";
import { SubjectHeader } from "@/components/classes/subject-header";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/classes/")({
	component: RouteComponent,
});

function RouteComponent() {
	const subjects = useQuery(orpc.subject.listSubjects.queryOptions({ input: {} }));

	return (
		<Container className="py-0">
			<SubjectHeader />

			<div className="space-y-4">
				{subjects.isPending && (
					<div className="grid h-full grid-cols-1 gap-2 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
						{Array.from({ length: 9 }).map((_, i) => (
							<Skeleton key={i.toString()} className="h-40 w-full" />
						))}
					</div>
				)}

				{subjects.isError && <p className="text-red-500">Error: {subjects.error.message}</p>}

				{subjects.data && subjects.data.length === 0 && <p className="text-muted-foreground">No subjects yet</p>}

				{subjects.data && subjects.data.length > 0 && (
					<div className="grid h-full grid-cols-1 gap-2 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
						{subjects.data.map((subject) => (
							<SubjectCard key={subject.id} subject={subject} />
						))}
					</div>
				)}
			</div>
		</Container>
	);
}
