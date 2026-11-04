import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import YouTubePlayer from "@/components/shared/youtube-player";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { extractYouTubeId } from "@/lib/youtube";

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
				queryClient.invalidateQueries({
					queryKey: orpc.subject.stats.key(),
				});
				// Also invalidate the content list to refresh completed status
				queryClient.invalidateQueries({
					queryKey: orpc.subject.listContent.key(),
				});
			},
			onError: () => {
				toast.error("Gagal memperbarui progress video");
				hasUpdatedProgress.current = false;
			},
		}),
	);

	// Update progress when video is viewed
	useEffect(() => {
		if (content.data?.video && !hasUpdatedProgress.current) {
			hasUpdatedProgress.current = true;
			updateProgressMutation.mutate({
				contentId,
				videoCompleted: true,
			});
		}
	}, [content.data?.video, contentId, updateProgressMutation]);

	if (content.isPending) {
		return <p className="animate-pulse text-sm">Memuat video...</p>;
	}

	if (content.isError) {
		return <p className="text-sm text-red-500">Error: {content.error.message}</p>;
	}

	if (!content.data) return notFound();

	const video = content.data.video;
	if (!video) {
		return (
			<div className="space-y-4">
				<p className="text-primary-300 text-base font-semibold">Video Materi</p>
				<EmptyContentState />
			</div>
		);
	}

	const videoId = extractYouTubeId(video.videoUrl);

	return (
		<div className="space-y-4">
			<p className="text-primary-300 text-base font-semibold">Video Materi</p>

			<div className="aspect-video w-full">
				<YouTubePlayer videoId={videoId} />
			</div>

			<h2 className="text-2xl font-bold">{content.data.title}</h2>
			<hr />

			<h3 className="text-lg font-semibold">Tentang Video</h3>
			<TiptapRenderer content={video.content} />
		</div>
	);
}
