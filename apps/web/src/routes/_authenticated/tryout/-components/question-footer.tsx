import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";

interface QuestionFooterProps {
	tryoutId: number;
	subtestId: number;
	currentIndex: number;
	isLastQuestion: boolean;
}

export function QuestionFooter({ tryoutId, subtestId, currentIndex, isLastQuestion }: QuestionFooterProps) {
	const queryClient = useQueryClient();
	const { nextQuestion, prevQuestion, toggleRaguRagu } = useTryoutStore();

	const submitSubtestMutation = useMutation(
		orpc.tryout.submitSubtest.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
				if (data.tryoutCompleted) {
					toast.success("Tryout selesai!");
				}
			},
			onError: (error: Error) => {
				toast.error(error.message);
			},
		}),
	);

	const handleNext = () => {
		if (isLastQuestion) {
			submitSubtestMutation.mutate({ tryoutId, subtestId });
		} else {
			nextQuestion();
		}
	};

	const handlePrev = () => {
		prevQuestion();
	};

	const handleRaguRagu = () => {
		toggleRaguRagu(0);
	};

	return (
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
	);
}
