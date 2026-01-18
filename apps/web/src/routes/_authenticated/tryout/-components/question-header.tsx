import { ClockIcon } from "@phosphor-icons/react";
import { buttonVariants } from "@/components/ui/button";
import useCountdown from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface QuestionHeaderProps {
	currentIndex: number;
	totalQuestions: number;
	deadline: Date | null;
}

export function QuestionHeader({ currentIndex, totalQuestions, deadline }: QuestionHeaderProps) {
	const [, hours, minutes, seconds] = useCountdown(deadline || 0);
	const isExpired = hours === "00" && minutes === "00" && seconds === "00" && deadline !== null;

	return (
		<div className="flex items-center justify-between">
			<span className="font-medium text-lg">
				Soal {currentIndex + 1} dari {totalQuestions}
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
