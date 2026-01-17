import { ClockIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useCountdown from "@/lib/hooks/use-countdown";
import { orpc } from "@/utils/orpc";

interface TryoutGreetingProps {
	tryoutId: number;
}

export function TryoutGreeting({ tryoutId }: TryoutGreetingProps) {
	const { data } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const queryClient = useQueryClient();
	const [, hours, minutes, seconds] = useCountdown(data?.currentSubtest?.deadline || 0);

	const startSubtestMutation = useMutation(
		orpc.tryout.startSubtest.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
		}),
	);

	if (!data?.currentSubtest) return null;

	const isCompletedSubtest =
		hours === "00" && minutes === "00" && seconds === "00" && data.currentSubtest.deadline !== null;

	return (
		<Card className="mx-auto flex max-w-xl flex-col gap-6 p-6">
			<div className="space-y-2">
				<h1 className="font-bold text-2xl">{data.currentSubtest.name}</h1>
				{data.currentSubtest.description && (
					<div className="text-muted-foreground">
						<TiptapRenderer content={data.currentSubtest.description} />
					</div>
				)}
			</div>

			{data.currentSubtest.deadline && (
				<div className="flex items-center gap-2 text-lg">
					<ClockIcon className="text-primary" />
					<span>
						{hours}:{minutes}:{seconds}
					</span>
				</div>
			)}

			<Button
				size="lg"
				className="w-full"
				onClick={() => startSubtestMutation.mutate({ tryoutId, subtestId: data.currentSubtest.id })}
				disabled={startSubtestMutation.isPending || isCompletedSubtest}
			>
				{startSubtestMutation.isPending ? "Memuat..." : isCompletedSubtest ? "Waktu Habis" : "Mulai"}
			</Button>
		</Card>
	);
}
