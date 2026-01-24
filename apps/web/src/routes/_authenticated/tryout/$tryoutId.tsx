import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import ErrorComponent from "@/components/error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useCountdown from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { TryoutGreeting } from "./-components/tryout-greeting";
import { TryoutQuestions } from "./-components/tryout-questions";
import { useTryoutStore } from "./-hooks/use-tryout-store";

export const Route = createFileRoute("/_authenticated/tryout/$tryoutId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { tryoutId } = Route.useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data, isPending, error } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: Number(tryoutId) },
		}),
	);

	const { reset, view, setView } = useTryoutStore();
	const prevSubtestIdRef = useRef<number | null>(null);
	const hasAutoSubmitted = useRef(false);

	const deadline = data?.currentSubtest?.deadline ?? null;
	const [, hours, minutes, seconds] = useCountdown(deadline || 0);
	const isExpired =
		typeof hours === "string" && hours === "00" && minutes === "00" && seconds === "00" && deadline !== null;

	const submitSubtestMutation = useMutation(
		orpc.tryout.submitSubtest.mutationOptions({
			onSuccess: (responseData) => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: Number(tryoutId) } }) });
				queryClient.invalidateQueries({
					queryKey: orpc.tryout.attemptResult.key({ input: { attemptId: data?.attempt.id } }),
				});
				if (responseData.tryoutCompleted) {
					toast.success("Tryout selesai!");
				} else {
					toast.info("Waktu habis! Subtest otomatis dikumpulkan.");
				}
				setView("greeting");
			},
			onError: (error: Error) => {
				toast.error(error.message);
			},
		}),
	);

	useEffect(() => {
		if (!data) return;

		if (data.attempt === null) {
			toast.error("Kamu belum memulai tryout ini");
			router.navigate({ to: "/tryout" });
			return;
		}

		if (data.attempt.status === "finished") {
			router.navigate({ to: "/tryout", search: { tab: "results" } });
			return;
		}

		if (data.currentSubtest === null) {
			toast.success("Tryout selesai!");
			router.navigate({ to: "/tryout", search: { tab: "results" } });
			return;
		}

		if (prevSubtestIdRef.current !== data.currentSubtest.id) {
			reset();
			hasAutoSubmitted.current = false;
			prevSubtestIdRef.current = data.currentSubtest.id;
		}
	}, [data, router, reset]);

	useEffect(() => {
		if (isExpired && data?.currentSubtest?.id && !hasAutoSubmitted.current && !submitSubtestMutation.isPending) {
			hasAutoSubmitted.current = true;
			submitSubtestMutation.mutate({ tryoutId: Number(tryoutId), subtestId: data.currentSubtest.id });
			router.navigate({ to: "/tryout", search: { tab: "results" } });
		}
	}, [isExpired, data, tryoutId, submitSubtestMutation, router.navigate]);

	if (isPending) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/tryout">
							<ArrowLeftIcon />
							Kembali
						</Link>
					</Button>
					<Skeleton className="h-6 w-32" />
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (error || !data) {
		return <ErrorComponent error={error} />;
	}

	return (
		<div className={cn("flex flex-col gap-4", view === "questions" && "h-[calc(100vh-2rem)]")}>
			{view === "greeting" && (
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/tryout">
							<ArrowLeftIcon />
							Kembali
						</Link>
					</Button>
				</div>
			)}

			{view === "greeting" ? (
				<TryoutGreeting
					countdownProps={{ hours: String(hours), minutes: String(minutes), seconds: String(seconds), isExpired }}
				/>
			) : (
				<TryoutQuestions
					countdownProps={{ hours: String(hours), minutes: String(minutes), seconds: String(seconds), isExpired }}
				/>
			)}
		</div>
	);
}
