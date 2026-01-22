import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function QuestionFooter() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const queryClient = useQueryClient();
	const { currentQuestionIndex, setView, nextQuestion, prevQuestion, toggleRaguRagu, currentQuestion } =
		useTryoutStore();

	const { data } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const questions = data?.currentSubtest?.questions ?? [];
	const subtestId = data?.currentSubtest?.id;
	const subtests = data?.subtests ?? [];
	const currentSubtestIndex = subtests.findIndex((s) => s.id === subtestId);
	const nextSubtest = subtests[currentSubtestIndex + 1];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;

	const submitSubtestMutation = useMutation(
		orpc.tryout.submitSubtest.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
				if (data.tryoutCompleted) {
					toast.success("Tryout selesai!");
				}
				setIsDialogOpen(false);
				setView("greeting");
			},
			onError: (error: Error) => {
				toast.error(error.message);
			},
		}),
	);

	const handleNext = () => {
		if (isLastQuestion) {
			setIsDialogOpen(true);
		} else {
			nextQuestion();
		}
	};

	const handleConfirmSubmit = () => {
		if (!subtestId) return;
		submitSubtestMutation.mutate({ tryoutId, subtestId });
	};

	const handlePrev = () => {
		prevQuestion();
	};

	const handleRaguRagu = () => {
		if (currentQuestion?.id) {
			toggleRaguRagu(currentQuestion.id);
		}
	};

	return (
		<>
			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					onClick={handlePrev}
					disabled={currentQuestionIndex === 0 || submitSubtestMutation.isPending}
				>
					<ArrowLeftIcon />
					Sebelumnya
				</Button>

				<Button variant="outline" onClick={handleRaguRagu}>
					Ragu-ragu
				</Button>

				<Button onClick={handleNext} disabled={submitSubtestMutation.isPending}>
					{isLastQuestion ? (
						"Selesai"
					) : (
						<>
							Selanjutnya
							<ArrowRightIcon />
						</>
					)}
				</Button>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Selesaikan Subtest?</DialogTitle>
						<DialogDescription>
							{nextSubtest ? (
								<span>
									Anda akan melanjutkan ke subtest berikutnya: <strong>{nextSubtest.name}</strong>. Anda tidak akan
									dapat mengubah jawaban Anda lagi, pastikan semua jawaban sudah sesuai.
								</span>
							) : (
								"Anda akan menyelesaikan tryout ini."
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Batal</Button>
						</DialogClose>
						<Button onClick={handleConfirmSubmit} disabled={submitSubtestMutation.isPending}>
							{submitSubtestMutation.isPending ? (
								<>
									<Spinner />
									Memindahkan...
								</>
							) : (
								"Ya, Lanjutkan"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
