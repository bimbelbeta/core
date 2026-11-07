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
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { LinkedQuestionsList } from "../-components/linked-questions-list";
import { QuestionPickerDialog } from "../-components/question-picker-dialog";

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId/latihan-soal")({
	staticData: { breadcrumb: "Latihan Soal" },
	component: RouteComponent,
});

function RouteComponent() {
	const { contentId: rawContentId } = Route.useParams();
	const contentId = parseRouteParamToNumber(rawContentId);
	const queryClient = useQueryClient();
	const [pickerOpen, setPickerOpen] = useState(false);

	// Fetch content for title
	const content = useQuery(
		orpc.subject.findContent.queryOptions({
			input: { contentId },
		}),
	);

	// Fetch linked practice questions
	const practiceQuestions = useQuery(
		orpc.admin.content.listPracticeQuestions.queryOptions({
			input: { id: contentId },
		}),
	);

	const unlinkAllMutation = useMutation(
		orpc.admin.content.clearPracticeQuestions.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries({
					queryKey: orpc.admin.content.listPracticeQuestions.queryKey({
						input: { id: contentId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.subject.findContent.queryKey({
						input: { contentId },
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
		return <Typography className="animate-pulse">Memuat latihan soal...</Typography>;
	}

	if (content.isError) {
		return <Typography tone="destructive">Error: {content.error.message}</Typography>;
	}

	if (!content.data) return notFound();

	const questions = practiceQuestions.data?.questions ?? [];
	const hasQuestions = questions.length > 0;
	const excludeIds = questions.map((q) => q.questionId);

	return (
		<div className="space-y-4">
			<div className="flex flex-col items-start justify-between space-y-1 sm:flex-row sm:items-center">
				<Typography variant="subtitle1">Edit Latihan Soal</Typography>
				<div className="flex items-center gap-2">
					<Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
						<Plus className="mr-1 size-4" />
						Tambah soal
					</Button>
					{hasQuestions && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									isPending={unlinkAllMutation.isPending}
									type="button"
									variant="destructive"
									disabled={unlinkAllMutation.isPending}
									size="sm"
								>
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
											unlinkAllMutation.mutate({ id: contentId });
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
				<LinkedQuestionsList contentId={contentId} questions={questions} />
			) : (
				<div className="flex flex-col items-center justify-center gap-4 py-12">
					<EmptyContentState title="Belum ada latihan soal" desc="Tambahkan soal dari bank soal untuk konten ini" />
					<Button type="button" onClick={() => setPickerOpen(true)}>
						<Plus className="mr-1 size-4" />
						Tambah soal
					</Button>
				</div>
			)}

			<QuestionPickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				onSuccess={handlePickerSuccess}
				contentId={contentId}
				excludeIds={excludeIds}
			/>
		</div>
	);
}
