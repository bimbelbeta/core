import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import { PracticeQuestion } from "@/components/classes/practice-question";
import { PracticeQuestionHeader } from "@/components/classes/practice-question-header";
import { TiptapRenderer } from "@/components/tiptap-renderer";
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

export const Route = createFileRoute("/admin/classes/$subjectId/$contentId/latihan-soal")({
	component: RouteComponent,
});

function RouteComponent() {
	const { subjectId, contentId } = Route.useParams();
	const queryClient = useQueryClient();

	const content = useQuery(
		orpc.subject.getContentById.queryOptions({
			input: { contentId: Number(contentId) },
		}),
	);

	const unlinkMutation = useMutation(
		orpc.admin.subject.unlinkPracticeQuestions.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
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

	if (content.isPending) {
		return <p className="animate-pulse text-sm">Memuat latihan soal...</p>;
	}

	if (content.isError) {
		return <p className="text-red-500 text-sm">Error: {content.error.message}</p>;
	}

	if (!content.data) return notFound();

	const practiceQuestions = content.data.practiceQuestions;
	const hasPracticeQuestions = practiceQuestions && practiceQuestions.questions.length > 0;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<BackButton to={`/admin/classes/${subjectId}/${contentId}`} />
				{hasPracticeQuestions && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button type="button" variant="destructive" disabled={unlinkMutation.isPending} size="sm">
								Hapus Semua
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Hapus Latihan Soal?</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah Anda yakin ingin menghapus semua latihan soal dari konten ini? Tindakan ini tidak dapat
									dibatalkan.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => {
										unlinkMutation.mutate({ id: Number(contentId) });
									}}
								>
									Hapus
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>

			<p className="font-semibold text-base text-primary-300">Latihan Soal</p>

			<PracticeQuestionHeader content={content.data.title} />

			<hr />

			{hasPracticeQuestions ? (
				<div className="space-y-4">
					{practiceQuestions.questions.map((q, idx) => (
						<PracticeQuestion
							key={q.questionId}
							questionNumber={idx + 1}
							totalQuestions={practiceQuestions.questions.length}
							question={<TiptapRenderer className="mt-4" content={q.question} />}
							answer={
								<div className="space-y-3">
									{q.answers && q.answers.length > 0 && (
										<div className="space-y-2">
											{q.answers.map((answer) => (
												<p
													key={answer.id}
													className={
														answer.isCorrect ? "font-semibold text-green-600 text-sm" : "text-muted-foreground text-sm"
													}
												>
													{answer.code}. {answer.content}
													{answer.isCorrect && " ✓"}
												</p>
											))}
										</div>
									)}
									{q.discussion && (
										<div className="mt-3 border-neutral-200 border-t pt-3">
											<p className="mb-1 font-medium text-sm">Pembahasan:</p>
											<TiptapRenderer content={q.discussion} />
										</div>
									)}
								</div>
							}
						/>
					))}
					<p className="text-muted-foreground text-sm">
						Untuk mengedit atau menambah latihan soal, gunakan fitur manajemen soal di halaman konten.
					</p>
				</div>
			) : (
				<EmptyContentState />
			)}
		</div>
	);
}
