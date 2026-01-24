import { ClockIcon, ListIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useCountdown from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function QuestionHeader() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const { currentQuestionIndex, currentQuestion, raguRaguIds, toggleQuestionGrid } = useTryoutStore();

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

	const isDoubtful = currentQuestion ? raguRaguIds.has(currentQuestion.id) : false;

	return (
		<>
			<div className="flex justify-between gap-2 max-sm:flex-col lg:items-center">
				<div className="flex flex-col">
					<p className="font-medium text-lg">
						Soal Nomor {currentQuestionIndex + 1} dari {totalQuestions}
					</p>
					<p className="text-muted-foreground text-sm">{data?.currentSubtest?.name}</p>
				</div>

				<div className="flex items-center gap-2">
					{isDoubtful && (
						<div className={cn(buttonVariants({ size: "xs", variant: "warning" }), "pointer-events-none")}>
							Ragu-Ragu
						</div>
					)}
					{deadline && (
						<div
							className={cn(
								buttonVariants({ size: "xs", variant: "outline", className: "text-secondary-700" }),
								isExpired && "text-red-500",
							)}
						>
							<ClockIcon className="size-5" />
							{hours}:{minutes}:{seconds}
						</div>
					)}
					<Button size="xs" variant="default" onClick={toggleQuestionGrid} className="gap-2">
						<ListIcon className="size-5" />
						Daftar Soal
					</Button>
				</div>
			</div>
			<Separator className="w-full" />
		</>
	);
}
