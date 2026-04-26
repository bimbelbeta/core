import { VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import YouTubePlayer from "@/components/shared/youtube-player";
import TiptapSimpleEditor from "@/components/tiptap/tiptap-simple-editor";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDebounceValue } from "@/hooks/use-debounce-value";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { orpc } from "@/utils/orpc";
import { extractYouTubeId } from "@/utils/youtube";

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId/video")({
	staticData: { breadcrumb: "Video" },
	component: RouteComponent,
});

function RouteComponent() {
	const { contentId: rawContentId } = Route.useParams();
	const contentId = parseRouteParamToNumber(rawContentId);
	const queryClient = useQueryClient();
	const [showPreview, setShowPreview] = useState(true);

	const content = useQuery(
		orpc.subject.findContent.queryOptions({
			input: { contentId },
		}),
	);

	const saveMutation = useMutation(
		orpc.admin.content.upsertVideo.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries({
					queryKey: orpc.subject.findContent.queryKey({
						input: {
							contentId,
						},
					}),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menyimpan video");
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.content.removeVideo.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries({
					queryKey: orpc.subject.findContent.queryKey({
						input: {
							contentId,
						},
					}),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menghapus video");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			videoUrl: "",
			content: {} as Record<string, unknown>,
		},
		onSubmit: async ({ value }) => {
			saveMutation.mutate({
				id: contentId,
				videoUrl: value.videoUrl,
				content: value.content,
			});
		},
		validators: {
			onSubmit: type({
				videoUrl: "string >= 1",
				content: "object",
			}),
		},
	});

	if (content.data?.video) {
		if (form.state.values.videoUrl !== content.data.video.videoUrl) {
			form.setFieldValue("videoUrl", content.data.video.videoUrl || "");
		}
		if (form.state.values.content !== content.data.video.content) {
			form.setFieldValue("content", (content.data.video.content as Record<string, unknown>) || {});
		}
	}

	const debouncedVideoUrl = useDebounceValue(form.state.values.videoUrl as string, 500);
	const videoId = extractYouTubeId(debouncedVideoUrl);
	const isValidUrl = !!videoId;

	if (content.isPending) {
		return <p className="animate-pulse text-sm">Memuat video...</p>;
	}

	if (content.isError) {
		return <p className="text-red-500 text-sm">Error: {content.error.message}</p>;
	}

	if (!content.data) return notFound();

	const hasVideo = !!content.data.video;

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between space-y-1 sm:flex-row sm:items-center">
				<h2 className="font-semibold text-lg">Edit Video Materi</h2>
				<div className="flex gap-2">
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								variant="default"
								disabled={!state.canSubmit || saveMutation.isPending}
								size="sm"
								onClick={() => form.handleSubmit()}
							>
								{saveMutation.isPending ? "Menyimpan..." : "Simpan"}
							</Button>
						)}
					</form.Subscribe>
					{hasVideo && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button type="button" variant="destructive" disabled={deleteMutation.isPending} size="sm">
									Hapus
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Hapus Video?</AlertDialogTitle>
									<AlertDialogDescription>
										Apakah Anda yakin ingin menghapus video ini? Tindakan ini tidak dapat dibatalkan.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Batal</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											deleteMutation.mutate({ id: contentId });
										}}
									>
										Hapus
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="videoUrl">
					{(field) => (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor={field.name}>URL Video (YouTube)</Label>
								<div className="flex items-center gap-2">
									{showPreview ? <VideoCamera className="size-4" /> : <VideoCameraSlash className="size-4" />}
									<Switch checked={showPreview} onCheckedChange={setShowPreview} />
								</div>
							</div>
							<Input
								id={field.name}
								name={field.name}
								type="url"
								value={field.state.value as string}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="https://www.youtube.com/watch?v=..."
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-red-500 text-sm">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				{showPreview && (
					<div className="space-y-2">
						<Label>Preview</Label>
						{isValidUrl ? (
							<div className="aspect-video w-full overflow-hidden rounded-lg border">
								<YouTubePlayer videoId={videoId} />
							</div>
						) : (
							<div className="flex aspect-video w-full items-center justify-center rounded-lg border border-muted-foreground/30 border-dashed bg-muted/50">
								<p className="text-muted-foreground text-sm">
									{debouncedVideoUrl ? "URL tidak valid" : "Masukkan URL YouTube untuk preview"}
								</p>
							</div>
						)}
					</div>
				)}

				<form.Field name="content">
					{(field) => (
						<div className="space-y-2">
							<Label>Konten Video (Deskripsi)</Label>
							<TiptapSimpleEditor
								content={field.state.value}
								onChange={(c) => field.handleChange(c as Record<string, unknown>)}
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-red-500 text-sm">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>
			</form>
		</div>
	);
}
