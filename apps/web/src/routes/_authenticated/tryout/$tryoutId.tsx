import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import ErrorComponent from "@/components/error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
	const { data, isPending, error } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: Number(tryoutId) },
		}),
	);

	const { reset, view } = useTryoutStore();
	const prevSubtestIdRef = useRef<number | null>(null);

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
			prevSubtestIdRef.current = data.currentSubtest.id;
		}
	}, [data, router, reset]);

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

			{view === "greeting" ? <TryoutGreeting /> : <TryoutQuestions />}
		</div>
	);
}
