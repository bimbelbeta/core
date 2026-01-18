import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { TryoutGreeting } from "./-components/tryout-greeting";
import { TryoutQuestions } from "./-components/tryout-questions";
import { useTryoutStore } from "./-hooks/use-tryout-store";

export const Route = createFileRoute("/_authenticated/tryout/$tryoutId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { tryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const router = useRouter();
	const { data, isPending, error } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: Number(tryoutId) },
		}),
	);

	const { setView, reset, setCurrentQuestion } = useTryoutStore();
	const prevSubtestIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!data) return;

		if (data.attempt === null) {
			toast.error("Kamu belum memulai tryout ini");
			router.navigate({ to: "/tryout" });
			return;
		}

		if (data.attempt.status === "finished") {
			router.navigate({ to: "/tryout" });
			return;
		}

		if (data.currentSubtest === null) {
			toast.success("Tryout selesai!");
			router.navigate({ to: "/tryout" });
			return;
		}

		if (prevSubtestIdRef.current !== data.currentSubtest.id) {
			reset();
			setCurrentQuestion(0);
			prevSubtestIdRef.current = data.currentSubtest.id;
		}

		if (data.currentSubtest.questions.length === 0) {
			setView("greeting");
		} else {
			setView("questions");
		}
	}, [data, router, setView, reset, setCurrentQuestion]);

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
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-8">
				<p className="text-red-500">Gagal memuat tryout</p>
				<Button asChild variant="outline">
					<Link to="/tryout">Kembali ke Tryout</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/tryout">
						<ArrowLeftIcon />
						Kembali
					</Link>
				</Button>
				<h1 className="font-semibold">{data.currentSubtest?.name}</h1>
			</div>

			<TryoutGreeting tryoutId={Number(tryoutId)} />
			<TryoutQuestions tryoutId={Number(tryoutId)} />
		</div>
	);
}
