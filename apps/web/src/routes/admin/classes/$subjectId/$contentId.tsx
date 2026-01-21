import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { BackButton } from "@/components/back-button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { subjectId, contentId } = Route.useParams();
	const navigate = useNavigate();
	const location = useLocation();

	const content = useQuery(
		orpc.subject.getContentById.queryOptions({
			input: { contentId: Number(contentId) },
		}),
	);

	const currentPath = location.pathname;
	const currentTab: "video" | "notes" = currentPath.endsWith("/notes") ? "notes" : "video";

	const handleTabChange = (value: string) => {
		navigate({
			to:
				value === "video" ? "/admin/classes/$subjectId/$contentId/video" : "/admin/classes/$subjectId/$contentId/notes",
			params: { subjectId, contentId },
		});
	};

	const displayTitle = content.data?.title || contentId;

	return (
		<Container className="gap-3 p-0">
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
				</TabsList>

				<TabsContent value={currentTab} className="pt-4">
					<Outlet />
				</TabsContent>
			</Tabs>
		</Container>
	);
}
