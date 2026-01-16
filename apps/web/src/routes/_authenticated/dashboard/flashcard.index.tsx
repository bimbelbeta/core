import { isDefinedError } from "@orpc/client";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { orpc } from "@/utils/orpc";
import { FlashcardCard } from "./-components/flashcard-card";

export const Route = createFileRoute("/_authenticated/dashboard/flashcard/")({
	component: RouteComponent,
});

interface PageStore {
	page: number;
	next: () => void;
}
export const useFlashcardPageStore = create<PageStore>()((set) => ({
	page: 1,
	next: () => set((state) => ({ page: state.page + 1 })),
}));

function RouteComponent() {
	const { session } = useRouteContext({ from: "/_authenticated" });
	const navigate = useNavigate();
	const flashcard = useQuery(
		orpc.flashcard.get.queryOptions({
			retry: false,
		}),
	);

	const [showPremiumDialog, setShowPremiumDialog] = useState(!session?.user.isPremium);

	if (flashcard.isPending) {
		return <Loader />;
	}

	if (flashcard.data?.status === "not_started") {
		return (
			<>
				<StartCard />
				<Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Fitur Terbatas!</DialogTitle>
							<DialogDescription>Dengan premium, kamu bisa bermain Brain Gym sepuasnya tanpa batas!</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowPremiumDialog(false)}>
								Mungkin Nanti
							</Button>
							<Button asChild>
								<Link to="/premium">Beli Premium</Link>
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	}

	if (flashcard.data?.status === "submitted") {
		navigate({ to: "/dashboard/flashcard/result" });
	}

	return <FlashcardCard />;
}

const StartCard = () => {
	const queryClient = useQueryClient();
	const { session } = useRouteContext({ from: "/_authenticated" });
	const navigate = useNavigate();
	const startMutation = useMutation(
		orpc.flashcard.start.mutationOptions({
			onSuccess: () => {
				queryClient.resetQueries({ queryKey: orpc.flashcard.get.key() });
			},
			onError: (error) => {
				if (isDefinedError(error) && error.code === "NOT_FOUND") {
					toast.error("Ups! Kamu sudah mengerjakan semua Brain Gym yang tersedia!", {
						description: "Silahkan coba lagi dalam beberapa saat.",
					});
				}
			},
		}),
	);

	if (!session) navigate({ to: "/login" });

	return (
		<section className="flex flex-col gap-4 rounded-md border bg-white p-6">
			<Button asChild className="w-fit">
				<Link to="/dashboard">
					<ArrowLeftIcon />
					Kembali
				</Link>
			</Button>

			<div className="flex overflow-clip rounded-md bg-yellow-200">
				<div className="min-w-32 rounded-l-md rounded-tr-full bg-yellow-500 px-4 py-2 font-bold text-4xl text-white">
					{session?.user.flashcardStreak || "0"}
				</div>
				<p className="my-auto p-4 font-medium text-xl">
					{session?.user.flashcardStreak && session?.user.flashcardStreak > 0 ? (
						<>
							Streak Brain Gym Kamu! <span className="font-normal">Keren!</span>
						</>
					) : (
						<>Streak kamu mati, main lagi yuk!</>
					)}
				</p>
			</div>

			<div className="flex flex-col gap-2 rounded-md bg-blue-400 p-6 pt-20 text-white">
				<h1 className="font-bold text-3xl">Brain Gym</h1>
				<p>Uji kemampuan harianmu dengan Brain Gym selama 10 menit!</p>
			</div>

			<Button
				onClick={() => {
					startMutation.mutate({});
				}}
				disabled={startMutation.isPending}
				className="ml-auto"
			>
				Mulai Sekarang
			</Button>
		</section>
	);
};
