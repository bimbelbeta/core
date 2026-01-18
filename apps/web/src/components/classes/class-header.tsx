import { Image } from "@unpic/react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/utils/is-admin";
import { BackButton } from "../back-button";
import { subtestCardAvatar, subtestCardBackground, subtestCardPattern } from "./classes-constants";
import type { SubtestListItem } from "./classes-types";

export function ClassHeader({ subtest }: { subtest: SubtestListItem }) {
	const isAdmin = useIsAdmin();
	const shortName = subtest?.shortName?.toLowerCase() as keyof typeof subtestCardBackground;
	const backgroundClass = subtestCardBackground[shortName] || "bg-secondary-400";
	const patternClass = subtestCardPattern[shortName] || "bg-secondary-600";
	const avatarSrc = subtestCardAvatar[shortName] || "/avatar/subtest-pu-avatar.webp";

	const forceTextWhite = backgroundClass.includes("text-white");

	return (
		<div className={cn(backgroundClass, "relative overflow-hidden rounded-default")}>
			{/* Back button */}
			<div className="z-10 mt-6 ml-6 sm:mt-10 sm:ml-10">
				<BackButton to={isAdmin ? "/admin/classes" : "/classes"} />
			</div>

			<div className="grid grid-cols-1 px-6 pt-4 pb-0 sm:grid-cols-2 sm:items-center sm:px-10 sm:pb-10 md:grid-cols-5">
				{/* TEXT — mobile top, desktop LEFT */}
				<div className={cn("relative z-10 max-w-xl md:col-span-3", forceTextWhite && "text-white")}>
					<h1
						className={cn(
							"font-bold text-[24px] leading-tight sm:text-[30px]",
							forceTextWhite ? "text-white" : "text-neutral-1000",
						)}
					>
						{subtest?.name}
					</h1>
					<p className={cn("mt-2 text-[14px] leading-[21px]", forceTextWhite ? "text-white/90" : "text-neutral-1000")}>
						{subtest?.description}
					</p>
				</div>

				{/* VISUAL */}
				<div className="relative -mx-6 h-32.5 overflow-hidden sm:mx-0 sm:h-auto sm:overflow-visible md:col-span-2">
					{/* Ellipse */}
					<div className={cn(patternClass, "absolute top-15 right-4 bottom-0 size-45 rounded-full sm:top-2")} />

					{/* Avatar */}
					<Image
						src={avatarSrc}
						alt={`${subtest?.name} Avatar`}
						width={260}
						height={260}
						className="absolute right-0 size-70 translate-x-1/8 -translate-y-15 select-none object-cover sm:bottom-0 sm:left-0 sm:size-90 sm:translate-x-1/6 sm:translate-y-1/2 sm:translate-y-[55%] sm:object-cover"
					/>
				</div>
			</div>
		</div>
	);
}
