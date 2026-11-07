import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import YouTubePlayer from "@/components/shared/youtube-player";
import { TiptapRenderer } from "@/components/tiptap/tiptap-renderer";
import { Typography } from "@/components/ui/typography";
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
		return <Typography className="animate-pulse">Memuat video...</Typography>;
	}

	if (content.isError) {
		return <Typography tone="destructive">Error: {content.error.message}</Typography>;
	}

	if (!content.data) return notFound();

	const video = content.data.video;
	if (!video) {
		return (
			<div className="space-y-4">
				<Typography variant="subtitle2" as="p" tone="accent">
					Video Materi
				</Typography>
				<EmptyContentState />
			</div>
		);
	}

	const videoId = extractYouTubeId(video.videoUrl);

	return (
		<div className="space-y-4">
			<Typography variant="subtitle2" as="p" tone="accent">
				Video Materi
			</Typography>

			<div className="aspect-video w-full">
				<YouTubePlayer videoId={videoId} />
			</div>

			<Typography variant="title" as="h2">
				{content.data.title}
			</Typography>
			<hr />

			<Typography variant="subtitle1" as="h3">
				Tentang Video
			</Typography>
			<TiptapRenderer content={video.content} />
		</div>
	);
}
