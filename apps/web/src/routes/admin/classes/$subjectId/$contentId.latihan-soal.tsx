import { Plus } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyContentState } from "@/components/classes/empty-content-state";
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
import { orpc } from "@/utils/orpc";
import { LinkedQuestionsList } from "../-components/linked-questions-list";
import { QuestionPickerDialog } from "../-components/question-picker-dialog";

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId/latihan-soal")({
	component: RouteComponent,
});

function RouteComponent() {
	const { contentId } = Route.useParams();
	const queryClient = useQueryClient();
	const [pickerOpen, setPickerOpen] = useState(false);

	// Fetch content for title
	const content = useQuery(
		orpc.subject.getContentById.queryOptions({
			input: { contentId: Number(contentId) },
		}),
	);

	// Fetch linked practice questions
	const practiceQuestions = useQuery(
		orpc.admin.subject.getContentPracticeQuestions.queryOptions({
			input: { id: Number(contentId) },
		}),
	);

	const unlinkAllMutation = useMutation(
		orpc.admin.subject.unlinkPracticeQuestions.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries({
					queryKey: orpc.admin.subject.getContentPracticeQuestions.queryKey({
						input: { id: Number(contentId) },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.subject.getContentById.queryKey({
						input: { contentId: Number(contentId) },
					}),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menghapus latihan soal");
			},
		}),
	);

	const handlePickerSuccess = () => {
		// Picker will invalidate queries on success
	};

	if (content.isPending || practiceQuestions.isPending) {
		return <p className="animate-pulse text-sm">Memuat latihan soal...</p>;
	}

	if (content.isError) {
		return <p className="text-red-500 text-sm">Error: {content.error.message}</p>;
	}

	if (!content.data) return notFound();

	const questions = practiceQuestions.data?.questions ?? [];
	const hasQuestions = questions.length > 0;
	const excludeIds = questions.map((q) => q.questionId);

	return (
		<div className="space-y-4">
			<div className="flex flex-col items-start justify-between space-y-1 sm:flex-row sm:items-center">
				<h2 className="font-semibold text-lg">Edit Catatan Materi</h2>
				<div className="flex items-center gap-2">
					<Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
						<Plus className="mr-1 size-4" />
						Tambah Soal
					</Button>
					{hasQuestions && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button type="button" variant="destructive" disabled={unlinkAllMutation.isPending} size="sm">
									Hapus Semua
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Hapus Semua Latihan Soal?</AlertDialogTitle>
									<AlertDialogDescription>
										Apakah Anda yakin ingin menghapus semua latihan soal dari konten ini? Soal tidak akan dihapus dari
										bank soal.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Batal</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											unlinkAllMutation.mutate({ id: Number(contentId) });
										}}
									>
										Hapus Semua
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			</div>

			<hr />

			{hasQuestions ? (
				<LinkedQuestionsList contentId={Number(contentId)} questions={questions} />
			) : (
				<div className="flex flex-col items-center justify-center gap-4 py-12">
					<EmptyContentState title="Belum ada latihan soal" desc="Tambahkan soal dari bank soal untuk konten ini" />
					<Button type="button" onClick={() => setPickerOpen(true)}>
						<Plus className="mr-1 size-4" />
						Tambah Soal
					</Button>
				</div>
			)}

			<QuestionPickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				onSuccess={handlePickerSuccess}
				contentId={Number(contentId)}
				excludeIds={excludeIds}
			/>
		</div>
	);
}
