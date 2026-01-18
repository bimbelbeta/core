import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/classes/$subjectId/$contentId/notes")({
	component: RouteComponent,
});

function RouteComponent() {
	const { contentId } = Route.useParams();
	const queryClient = useQueryClient();

	const content = useQuery(
		orpc.subject.getContentById.queryOptions({
			input: { contentId: Number(contentId) },
		}),
	);

	const updateProgressMutation = useMutation(
		orpc.subject.updateProgress.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.subject.getProgressStats.key(),
				});
			},
		}),
	);

	// Update progress when notes are viewed
	useEffect(() => {
		if (content.data?.note) {
			updateProgressMutation.mutate({
				id: Number(contentId),
				noteCompleted: true,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [content.data?.note, contentId, updateProgressMutation.mutate]);

	if (content.isPending) {
		return <p className="animate-pulse text-sm">Memuat catatan...</p>;
	}

	if (content.isError) {
		return <p className="text-red-500 text-sm">Error: {content.error.message}</p>;
	}

	if (!content.data) return notFound();

	const note = content.data.note;
	if (!note) {
		return (
			<div className="space-y-4">
				<p className="font-semibold text-base text-primary-300">Catatan Materi</p>
				<EmptyContentState />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<p className="font-semibold text-base text-primary-300">Catatan Materi</p>

			<h2 className="font-bold text-2xl">{content.data.title}</h2>

			<hr />

			<TiptapRenderer content={note.content} />
		</div>
	);
}
