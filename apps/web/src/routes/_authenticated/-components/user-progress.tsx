import { ArrowRightIcon, EyeIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

export const UserProgress = () => {
	return (
		<section className="">
			<h2 className="mb-2 font-medium">Progres Kamu!</h2>
			<div className="grid gap-2 sm:grid-cols-5">
				<div className="space-y-2 sm:col-span-2">
					<Material />
					<Tryout />
				</div>
				<Flashcard />
			</div>
		</section>
	);
};

const Material = () => {
	const { data, isPending } = useQuery(orpc.subtest.getProgressStats.queryOptions());

	return (
		<div className="relative flex min-h-30 items-end justify-between gap-4 overflow-clip rounded-md bg-blue-200 p-4 text-primary">
			<div className="z-10 space-y-0.5">
				<h4 className={`font-bold text-4xl sm:text-5xl ${isPending && "animate-pulse"}`}>
					{!isPending ? (data?.materialsCompleted ?? 0) : "..."}
				</h4>
				<p className="font-bold">Materi Dipelajari</p>
			</div>

			<Button size="icon" className="z-10" asChild>
				<Link to="/classes">
					<ArrowRightIcon weight="bold" />
				</Link>
			</Button>

			<div className="absolute -bottom-[10%] -left-[5%] z-0 aspect-square h-full rounded-full bg-blue-300" />
			<Image
				src="/avatar/class-avatar.webp"
				alt=""
				width={75}
				height={75}
				className="absolute -right-[20%] -bottom-[30%] z-0 w-auto object-contain"
			/>
		</div>
	);
};

const Tryout = () => {
	return (
		<div className="relative flex min-h-30 items-end justify-between gap-4 overflow-clip rounded-md bg-green-200 p-4 text-green-800">
			<div className="z-10 space-y-0.5">
				<h2 className="font-bold text-2xl">Kerjakan Tryout</h2>
			</div>

			<Button asChild size="icon" variant="secondary" className="z-10">
				<a
					href="https://www.anycademy.com"
					rel="noopener noreferrer"
					target="_blank"
					aria-label="Visit AnyAcademy website"
				>
					<ArrowRightIcon />
				</a>
			</Button>

			<div className="absolute -bottom-[10%] -left-[5%] z-0 aspect-square h-full rounded-full bg-green-300" />
			<Image
				src="/avatar/tryout-avatar.webp"
				alt=""
				width={200}
				height={200}
				className="absolute -right-[10%] -bottom-[30%] z-0 object-contain"
			/>
		</div>
	);
};

const Flashcard = () => {
	const { session } = useRouteContext({ from: "/_authenticated" });
	if (!session) return null;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return (
		<div className="relative flex items-end justify-between gap-4 overflow-clip rounded-md bg-purple-900/90 p-4 text-white sm:col-span-3">
			<div className="z-10 space-y-0.5">
				<h4 className={"font-bold text-5xl sm:text-6xl"}>{session.user.flashcardStreak}</h4>
				<p className="font-bold">Streak Brain Gym</p>
			</div>

			<Button
				size="lg"
				className="z-10 max-sm:h-auto max-sm:text-wrap max-sm:py-1 max-sm:text-xs max-sm:has-[>svg]:px-2"
				asChild
			>
				{session.user.lastCompletedFlashcardAt?.getTime() >= today.getTime() ? (
					<Link to="/dashboard/flashcard/result">
						Lihat Hasil <EyeIcon />
					</Link>
				) : (
					<Link to="/dashboard/flashcard">
						Mainkan Flashcard Sekarang <ArrowRightIcon />
					</Link>
				)}
			</Button>
			{session.user.isPremium && session.user.lastCompletedFlashcardAt?.getTime() >= today.getTime() && (
				<Button
					size="lg"
					className="z-10 max-sm:h-auto max-sm:text-wrap max-sm:py-1 max-sm:text-xs max-sm:has-[>svg]:px-2"
					asChild
				>
					<Link to="/dashboard/flashcard">
						Main Lagi <ArrowRightIcon />
					</Link>
				</Button>
			)}

			<div className="absolute -bottom-1/2 -left-[5%] z-0 aspect-square h-full rounded-full bg-purple-200/10 sm:-bottom-[20%]" />
			<Image
				src="/avatar/cards.webp"
				alt=""
				width={300}
				height={300}
				className="absolute right-0 -bottom-[5%] z-0 object-contain"
			/>
		</div>
	);
};
