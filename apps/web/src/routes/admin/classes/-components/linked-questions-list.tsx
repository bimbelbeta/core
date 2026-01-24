import { DotsSixVertical, Trash } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Reorder, useDragControls } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

interface LinkedQuestion {
	questionId: number;
	order: number;
	type: "multiple_choice" | "essay";
	content: unknown;
	discussion: unknown;
	tags: string[];
	choices: Array<{
		id: number;
		questionId: number;
		code: string;
		content: string;
		isCorrect: boolean;
	}>;
}

interface LinkedQuestionsListProps {
	contentId: number;
	questions: LinkedQuestion[];
}

function LinkedQuestionItem({
	question,
	index,
	contentId,
	onRemoveSuccess,
}: {
	question: LinkedQuestion;
	index: number;
	contentId: number;
	onRemoveSuccess: () => void;
}) {
	const dragControls = useDragControls();
	const queryClient = useQueryClient();

	const removeMutation = useMutation(
		orpc.admin.subject.unlinkSinglePracticeQuestion.mutationOptions({
			onSuccess: (result) => {
				toast.success(result.message);
				queryClient.invalidateQueries({
					queryKey: orpc.admin.subject.getContentPracticeQuestions.queryKey({
						input: { id: contentId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.subject.getContentById.queryKey({
						input: { contentId },
					}),
				});
				onRemoveSuccess();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<Reorder.Item
			value={question}
			dragListener={false}
			dragControls={dragControls}
			className="flex items-start gap-3 rounded-lg border bg-background p-3"
		>
			<div
				className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground"
				onPointerDown={(e) => dragControls.start(e)}
			>
				<DotsSixVertical className="size-5" />
			</div>

			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex items-start gap-2">
					<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{index + 1}</span>
					<div className="prose prose-sm [&_*]:!m-0 line-clamp-2 min-w-0 flex-1 text-sm [&_p]:line-clamp-2">
						<TiptapRenderer content={question.content} />
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<Badge variant={question.type === "multiple_choice" ? "default" : "outline"} className="text-xs">
						{question.type === "multiple_choice" ? "Pilihan Ganda" : "Esai"}
					</Badge>
					{question.tags?.slice(0, 3).map((tag) => (
						<Badge key={tag} variant="secondary" className="text-xs">
							{tag}
						</Badge>
					))}
					{question.type === "multiple_choice" && question.choices.length > 0 && (
						<span className="text-muted-foreground text-xs">{question.choices.length} pilihan</span>
					)}
				</div>
			</div>

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="shrink-0 text-muted-foreground hover:text-destructive"
						disabled={removeMutation.isPending}
					>
						<Trash className="size-4" />
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Soal?</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus soal ini dari konten? Soal tidak akan dihapus dari bank soal.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								removeMutation.mutate({
									id: contentId,
									questionId: question.questionId,
								});
							}}
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Reorder.Item>
	);
}

export function LinkedQuestionsList({ contentId, questions }: LinkedQuestionsListProps) {
	const [items, setItems] = useState(questions);
	const queryClient = useQueryClient();

	// Keep items in sync with questions prop
	if (JSON.stringify(items.map((i) => i.questionId)) !== JSON.stringify(questions.map((q) => q.questionId))) {
		setItems(questions);
	}

	const reorderMutation = useMutation(
		orpc.admin.subject.reorderPracticeQuestions.mutationOptions({
			onSuccess: () => {
				// Silent success - no toast needed for reorder
				queryClient.invalidateQueries({
					queryKey: orpc.admin.subject.getContentPracticeQuestions.queryKey({
						input: { id: contentId },
					}),
				});
			},
			onError: (err) => {
				toast.error(`Gagal menyimpan urutan: ${err.message}`);
				// Reset to original order on error
				setItems(questions);
			},
		}),
	);

	const handleReorder = (newItems: LinkedQuestion[]) => {
		setItems(newItems);
	};

	const handleReorderEnd = () => {
		const newOrder = items.map((item) => item.questionId);
		const originalOrder = questions.map((q) => q.questionId);

		// Only call API if order actually changed
		if (JSON.stringify(newOrder) !== JSON.stringify(originalOrder)) {
			reorderMutation.mutate({
				id: contentId,
				questionIds: newOrder,
			});
		}
	};

	const handleRemoveSuccess = () => {
		// Refetch will be triggered by the mutation invalidation
	};

	if (items.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<p className="text-muted-foreground text-xs">Seret untuk mengubah urutan soal</p>
			<Reorder.Group
				axis="y"
				values={items}
				onReorder={handleReorder}
				className="space-y-2"
				onPointerUp={handleReorderEnd}
			>
				{items.map((question, index) => (
					<LinkedQuestionItem
						key={question.questionId}
						question={question}
						index={index}
						contentId={contentId}
						onRemoveSuccess={handleRemoveSuccess}
					/>
				))}
			</Reorder.Group>
		</div>
	);
}
