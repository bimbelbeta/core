import { ArrowRightIcon, ClockIcon } from "@phosphor-icons/react";
import { ListNumbersIcon } from "@phosphor-icons/react/dist/icons/ListNumbers";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
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

	const submitSubtestMutation = useMutation(
		orpc.tryout.submitSubtest.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
			},
		}),
	);

	if (view !== "greeting" || !data || !data.currentSubtest) return null;

	const isCompletedSubtest =
		hours === "00" && minutes === "00" && seconds === "00" && data.currentSubtest?.deadline !== null;

	const isOverallDeadlineExpired = data.overallDeadline && new Date() > new Date(data.overallDeadline);

	return (
		<Card className="flex w-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<p className="font-semibold text-lg text-muted-foreground">Subtest {data.currentSubtest.order}</p>
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
				<h1 className="font-bold text-4xl">{data.currentSubtest?.name}</h1>
				{data.currentSubtest.description && (
					<div className="font-bold text-lg text-muted-foreground">{data.currentSubtest.description}</div>
				)}
				<div className="mt-2 text-muted-foreground">
					<p className="flex items-center gap-2">
						<ListNumbersIcon weight="bold" />
						{data.currentSubtest.questions.length} pertanyaan
					</p>
					<p className="flex items-center gap-2">
						<ClockIcon weight="bold" />
						{data.currentSubtest.duration} menit
					</p>
				</div>
			</div>

			<Button
				size="lg"
				onClick={() => {
					if (isCompletedSubtest) {
						submitSubtestMutation.mutate({ tryoutId, subtestId: data.currentSubtest!.id });
					} else {
						setView("questions");
					}
				}}
				disabled={startSubtestMutation.isPending || submitSubtestMutation.isPending || isOverallDeadlineExpired}
				className="mt-8 ml-auto"
			>
				{startSubtestMutation.isPending || submitSubtestMutation.isPending ? (
					<>
						<CircleNotchIcon weight="bold" className="animate-spin" />
						Memuat...
					</>
				) : isOverallDeadlineExpired ? (
					<>
						<ClockIcon weight="bold" />
						Tryout Berakhir
					</>
				) : isCompletedSubtest ? (
					<>
						<ClockIcon weight="bold" />
						Lanjut
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
