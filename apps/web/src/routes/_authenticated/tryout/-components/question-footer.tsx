import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";

interface QuestionFooterProps {
	tryoutId: number;
	subtestId: number;
	currentIndex: number;
	isLastQuestion: boolean;
}

export function QuestionFooter({ tryoutId, subtestId, currentIndex, isLastQuestion }: QuestionFooterProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const queryClient = useQueryClient();
	const { setView, nextQuestion, prevQuestion, toggleRaguRagu } = useTryoutStore();

	const { data: tryout } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const subtests = tryout?.subtests ?? [];
	const currentSubtestIndex = subtests.findIndex((s) => s.id === subtestId);
	const nextSubtest = subtests[currentSubtestIndex + 1];

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
		submitSubtestMutation.mutate({ tryoutId, subtestId });
	};

	const handlePrev = () => {
		prevQuestion();
	};

	const handleRaguRagu = () => {
		toggleRaguRagu(0);
	};

	return (
		<>
			<div className="flex items-center justify-between">
				<Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0 || submitSubtestMutation.isPending}>
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
							{nextSubtest
								? `Anda akan melanjutkan ke subtest berikutnya: ${nextSubtest.name}.`
								: "Anda akan menyelesaikan tryout ini."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Batal</Button>
						</DialogClose>
						<Button onClick={handleConfirmSubmit} disabled={submitSubtestMutation.isPending}>
							{submitSubtestMutation.isPending ? "Memproses..." : "Ya, Lanjutkan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
