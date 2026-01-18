import { ClockIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import useCountdown from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function QuestionHeader() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const { currentQuestionIndex } = useTryoutStore();

	const { data } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const questions = data?.currentSubtest?.questions ?? [];
	const totalQuestions = questions.length;
	const deadline = data?.currentSubtest?.deadline ?? null;

	const [, hours, minutes, seconds] = useCountdown(deadline || 0);
	const isExpired = hours === "00" && minutes === "00" && seconds === "00" && deadline !== null;

	return (
		<div className="flex items-center justify-between">
			<span className="font-medium text-lg">
				Soal {currentQuestionIndex + 1} dari {totalQuestions}
			</span>
			{deadline && (
				<div
					className={cn(
						buttonVariants({ size: "sm", variant: "outline", className: "text-secondary-700" }),
						isExpired && "text-red-500",
					)}
				>
					<ClockIcon className="size-5" />
					{hours}:{minutes}:{seconds}
				</div>
			)}
		</div>
	);
}
