import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
	AdminBackLink,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId")({
	staticData: {
		breadcrumb: "Content",
		breadcrumbParents: [{ label: "Kelas", to: "/admin/classes" }],
		breadcrumbParent: { label: "Subject", to: "/admin/classes/$subjectId" },
	},
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
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminBackLink to="/admin/classes/$subjectId" params={{ subjectId: subjectId.toString() }}>
						Kembali ke subject
					</AdminBackLink>
					{content.isPending ? (
						<Skeleton className="h-7 w-48" />
					) : content.isError ? (
						<Typography variant="title" tone="destructive">
							Error: {content.error.message}
						</Typography>
					) : (
						<Typography variant="title">{displayTitle}</Typography>
					)}
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent>
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
			</AdminPageContent>
		</AdminPageRoot>
	);
}
