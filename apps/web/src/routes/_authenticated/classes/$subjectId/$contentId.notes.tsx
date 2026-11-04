import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";

export const Route = createFileRoute("/_authenticated/classes/$subjectId/$contentId/notes")({
	component: RouteComponent,
});

function RouteComponent() {
	const { contentId: rawContentId } = Route.useParams();
	const contentId = parseRouteParamToNumber(rawContentId);
	const queryClient = useQueryClient();

	const content = useQuery(
		orpc.subject.findContent.queryOptions({
			input: { contentId },
		}),
	);

	const updateProgressMutation = useMutation(
		orpc.subject.updateProgress.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.subject.stats.key(),
				});
			},
		}),
	);

	const mutateRef = useRef(updateProgressMutation.mutate);
	mutateRef.current = updateProgressMutation.mutate;

	// Update progress when notes are viewed
	useEffect(() => {
		if (content.data?.note) {
			mutateRef.current({
				contentId,
				noteCompleted: true,
			});
		}
	}, [content.data?.note, contentId]);

	if (content.isPending) {
		return <Typography className="animate-pulse">Memuat catatan...</Typography>;
	}

	if (content.isError) {
		return <Typography tone="destructive">Error: {content.error.message}</Typography>;
	}

	if (!content.data) return notFound();

	const note = content.data.note;
	if (!note) {
		return (
			<div className="space-y-4">
				<Typography variant="subtitle2" as="p" className="text-primary-300">
					Catatan Materi
				</Typography>
				<EmptyContentState />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Typography variant="subtitle2" as="p" className="text-primary-300">
				Catatan Materi
			</Typography>

			<Typography variant="title" as="h2">
				{content.data.title}
			</Typography>

			<hr />

			<TiptapRenderer content={note.content} />
		</div>
	);
}
