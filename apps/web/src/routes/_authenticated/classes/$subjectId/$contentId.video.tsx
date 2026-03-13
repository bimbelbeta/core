import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import YouTubePlayer from "@/components/youtube-player";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { orpc } from "@/utils/orpc";
import { extractYouTubeId } from "@/utils/youtube";

export const Route = createFileRoute("/_authenticated/classes/$subjectId/$contentId/video")({
	component: RouteComponent,
});

function RouteComponent() {
	const { contentId: rawContentId } = Route.useParams();
	const contentId = parseRouteParamToNumber(rawContentId);
	const queryClient = useQueryClient();
	const hasUpdatedProgress = useRef(false);

	const content = useQuery(
		orpc.subject.findContent.queryOptions({
			input: { contentId },
		}),
	);

	const updateProgressMutation = useMutation(
		orpc.subject.updateProgress.mutationOptions({
			onSuccess: () => {
				console.log("Progress updated successfully for video:", contentId);
				queryClient.invalidateQueries({
					queryKey: orpc.subject.stats.key(),
				});
				// Also invalidate the content list to refresh completed status
				queryClient.invalidateQueries({
					queryKey: orpc.subject.listContent.key(),
				});
			},
			onError: (error) => {
				console.error("Failed to update progress:", error);
				// Reset flag so it can retry
				hasUpdatedProgress.current = false;
			},
		}),
	);

	// Update progress when video is viewed
	useEffect(() => {
		if (content.data?.video && !hasUpdatedProgress.current) {
			hasUpdatedProgress.current = true;
			updateProgressMutation.mutate({
				id: contentId,
				videoCompleted: true,
			});
		}
	}, [content.data?.video, contentId, updateProgressMutation]);

	if (content.isPending) {
		return <p className="animate-pulse text-sm">Memuat video...</p>;
	}

	if (content.isError) {
		return <p className="text-red-500 text-sm">Error: {content.error.message}</p>;
	}

	if (!content.data) return notFound();

	const video = content.data.video;
	if (!video) {
		return (
			<div className="space-y-4">
				<p className="font-semibold text-base text-primary-300">Video Materi</p>
				<EmptyContentState />
			</div>
		);
	}

	const videoId = extractYouTubeId(video.videoUrl);

	return (
		<div className="space-y-4">
			<p className="font-semibold text-base text-primary-300">Video Materi</p>

			<div className="aspect-video w-full">
				<YouTubePlayer videoId={videoId} />
			</div>

			<h2 className="font-bold text-2xl">{content.data.title}</h2>
			<hr />

			<h3 className="font-semibold text-lg">Tentang Video</h3>
			<TiptapRenderer content={video.content} />
		</div>
	);
}
