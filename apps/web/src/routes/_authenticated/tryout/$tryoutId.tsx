import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ErrorComponent from "@/components/shared/error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import { TryoutGreeting } from "./-components/tryout-greeting";
import { TryoutQuestions } from "./-components/tryout-questions";
import useCountdown from "./-hooks/use-countdown";
import { useTryoutStore } from "./-hooks/use-tryout-store";

export const Route = createFileRoute("/_authenticated/tryout/$tryoutId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { tryoutId: rawTryoutId } = Route.useParams();
	const tryoutId = parseRouteParamToNumber(rawTryoutId);
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data, isPending, error } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const { reset, view, setView } = useTryoutStore();
	const prevSubtestIdRef = useRef<number | null>(null);
	const hasAutoSubmitted = useRef(false);
	// Track when component mounted to prevent immediate auto-submit due to clock skew
	const [canAutoSubmit, setCanAutoSubmit] = useState(false);

	useEffect(() => {
		// Add a 3-second grace period after mount before allowing auto-submit
		// This prevents auto-submit due to server-client clock skew
		const timer = setTimeout(() => {
			setCanAutoSubmit(true);
		}, 3000);
		return () => clearTimeout(timer);
	}, []);

	const deadline = data?.currentSubtest?.deadline ?? null;
	// Only run countdown when there's an actual deadline; use a future date as placeholder to avoid immediate expiration
	const [, hours, minutes, seconds] = useCountdown(deadline ?? new Date(Date.now() + 24 * 60 * 60 * 1000));
	const isExpired =
		typeof hours === "string" && hours === "00" && minutes === "00" && seconds === "00" && deadline !== null;

	const submitSubtestMutation = useMutation(
		orpc.tryout.submitSubtest.mutationOptions({
			onSuccess: (responseData) => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
				queryClient.invalidateQueries({
					queryKey: orpc.tryout.result.key({ input: { attemptId: data?.attempt.id } }),
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
		if (
			isExpired &&
			data?.currentSubtest?.deadline &&
			!hasAutoSubmitted.current &&
			!submitSubtestMutation.isPending &&
			canAutoSubmit
		) {
			hasAutoSubmitted.current = true;
			submitSubtestMutation.mutate({ tryoutId: tryoutId, subtestId: data.currentSubtest.id });
			router.navigate({ to: "/tryout", search: { tab: "results" } });
		}
	}, [isExpired, data, tryoutId, submitSubtestMutation, router.navigate, canAutoSubmit]);

	if (isPending) {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/tryout">
							<ArrowLeftIcon />
							Kembali
						</Link>
					</Button>
					<Skeleton className="h-8 w-56" />
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
			<div className="flex flex-col gap-1">
				<Button variant="ghost" size="sm" asChild className="self-start">
					<Link to="/tryout">
						<ArrowLeftIcon />
						Kembali
					</Link>
				</Button>
				<h1 className="font-bold text-2xl">{data.title}</h1>
			</div>

			{view === "greeting" ? (
				<TryoutGreeting
					countdownProps={{ hours: String(hours), minutes: String(minutes), seconds: String(seconds), isExpired }}
				/>
			) : (
				<TryoutQuestions
					countdownProps={{ hours: String(hours), minutes: String(minutes), seconds: String(seconds), isExpired }}
					data={data}
				/>
			)}
		</div>
	);
}
