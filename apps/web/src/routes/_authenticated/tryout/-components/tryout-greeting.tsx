import { ArrowRightIcon, ClockIcon } from "@phosphor-icons/react";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { TiptapRenderer } from "@/components/tiptap-renderer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import useCountdown from "@/lib/hooks/use-countdown";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";

export function TryoutGreeting() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const { data } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const queryClient = useQueryClient();
	const { view, setView } = useTryoutStore();
	const [, hours, minutes, seconds] = useCountdown(data?.currentSubtest?.deadline || 0);

	const startSubtestMutation = useMutation(
		orpc.tryout.startSubtest.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
		}),
	);

	if (view !== "greeting" || !data || !data.currentSubtest) return null;

	const isCompletedSubtest =
		hours === "00" && minutes === "00" && seconds === "00" && data.currentSubtest?.deadline !== null;

	return (
		<Card className="flex w-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<p className="font-semibold text-muted-foreground">h2</p>
				{data.currentSubtest?.deadline && (
					<div className={buttonVariants({ variant: "outline", size: "sm" })}>
						<ClockIcon />
						<span>
							{hours}:{minutes}:{seconds}
						</span>
					</div>
				)}
			</div>

			<Separator />

			<div className="space-y-2">
				<h1 className="font-bold text-6xl">{data.currentSubtest?.name}</h1>
				{data.currentSubtest?.description && (
					<div className="font-bold text-muted-foreground">
						<TiptapRenderer content={data.currentSubtest.description} />
					</div>
				)}
			</div>

			<Button
				size="lg"
				onClick={() => {
					setView("questions");
				}}
				disabled={startSubtestMutation.isPending || isCompletedSubtest}
				className="mt-4 ml-auto"
			>
				{startSubtestMutation.isPending ? (
					<>
						<CircleNotchIcon weight="bold" className="animate-spin" />
						Memuat...
					</>
				) : isCompletedSubtest ? (
					<>
						<ClockIcon weight="bold" />
						Waktu Habis
					</>
				) : (
					<>
						Mulai
						<ArrowRightIcon weight="bold" />
					</>
				)}
			</Button>
		</Card>
	);
}
