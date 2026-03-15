import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { BackButton } from "@/components/back-button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { subjectId: rawSubjectId, contentId: rawContentId } = Route.useParams();
	const subjectId = parseRouteParamToNumber(rawSubjectId);
	const contentId = parseRouteParamToNumber(rawContentId);
	const navigate = useNavigate();
	const location = useLocation();

	const content = useQuery(
		orpc.subject.findContent.queryOptions({
			input: { contentId },
		}),
	);

	const currentPath = location.pathname;
	const currentTab: "video" | "notes" | "latihan-soal" = currentPath.endsWith("/notes")
		? "notes"
		: currentPath.endsWith("/latihan-soal")
			? "latihan-soal"
			: "video";

	const handleTabChange = (value: string) => {
		navigate({
			to:
				value === "video"
					? "/admin/classes/$subjectId/$contentId/video"
					: value === "notes"
						? "/admin/classes/$subjectId/$contentId/notes"
						: "/admin/classes/$subjectId/$contentId/latihan-soal",
			params: { subjectId: subjectId.toString(), contentId: contentId.toString() },
		});
	};

	const displayTitle = content.data?.title || contentId;

	if (!content.isPending && !content.data) return notFound();

	return (
		<Container className="gap-3 px-0 py-4">
			<div className="w-fit">
				<BackButton to={`/admin/classes/${subjectId}`} />
				{content.isPending ? (
					<Skeleton className="mt-3 h-7 w-full" />
				) : content.isError ? (
					<h1 className="mt-3 font-bold text-red-500 text-xl">Error: {content.error.message}</h1>
				) : (
					<h1 className="mt-3 font-bold text-xl">{displayTitle}</h1>
				)}
			</div>

			<Tabs value={currentTab} onValueChange={handleTabChange}>
				<TabsList>
					<TabsTrigger value="video">Video</TabsTrigger>
					<TabsTrigger value="notes">Catatan</TabsTrigger>
					<TabsTrigger value="latihan-soal">Latihan Soal</TabsTrigger>
				</TabsList>

				<TabsContent value={currentTab} className="pt-4">
					<Outlet />
				</TabsContent>
			</Tabs>
		</Container>
	);
}
