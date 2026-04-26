import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { type } from "arktype";
import { toast } from "sonner";
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
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId/notes")({
	staticData: { breadcrumb: "Catatan" },
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

	const saveMutation = useMutation(
		orpc.admin.content.upsertNote.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries({
					queryKey: orpc.subject.findContent.queryKey({
						input: { contentId },
					}),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menyimpan catatan");
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.content.removeNote.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries({
					queryKey: orpc.subject.findContent.queryKey({
						input: { contentId },
					}),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menghapus catatan");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			content: {} as Record<string, unknown>,
		},
		onSubmit: async ({ value }) => {
			saveMutation.mutate({
				id: contentId,
				content: value.content,
			});
		},
		validators: {
			onSubmit: type({
				content: "object",
			}),
		},
	});

	if (content.data?.note) {
		if (form.state.values.content !== content.data.note.content) {
			form.setFieldValue("content", (content.data.note.content as Record<string, unknown>) || {});
		}
	}

	if (content.isPending) {
		return <p className="animate-pulse text-sm">Memuat catatan...</p>;
	}

	if (content.isError) {
		return <p className="text-red-500 text-sm">Error: {content.error.message}</p>;
	}

	if (!content.data) return notFound();

	const hasNote = !!content.data.note;

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between space-y-1 sm:flex-row sm:items-center">
				<h2 className="font-semibold text-lg">Edit Catatan Materi</h2>
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
					{hasNote && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button type="button" variant="destructive" disabled={deleteMutation.isPending} size="sm">
									Hapus
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
									<AlertDialogDescription>
										Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.
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
				<form.Field name="content">
					{(field) => (
						<div className="space-y-2">
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
