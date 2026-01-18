import { ArrowRightIcon, LockIcon, LockKeyIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Card } from "@/components/ui/card";
import { isSubtestPremium } from "@/lib/premium-config";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/utils/is-admin";
import { buttonVariants } from "../ui/button";
import { subtestCardAvatar, subtestCardBackground, subtestCardPattern } from "./classes-constants";
import type { SubtestListItem } from "./classes-types";

export function SubtestCard({
	subtest,
	userIsPremium,
	userRole,
}: {
	subtest: SubtestListItem;
	userIsPremium?: boolean;
	userRole?: string;
}) {
	const isAdmin = useIsAdmin();
	const shortName = subtest?.shortName?.toLowerCase() as keyof typeof subtestCardBackground;
	const backgroundClass = subtestCardBackground[shortName] || "bg-secondary-400";
	const patternClass = subtestCardPattern[shortName] || "bg-secondary-600";
	const avatarSrc = subtestCardAvatar[shortName] || "/avatar/subtest-pu-avatar.webp";
	// Use subtest.order to determine if premium (order > 1 means premium)
	const isPremiumSubtest = isSubtestPremium(subtest?.order ?? 1, userRole, userIsPremium);
	const isLocked = !isAdmin && isPremiumSubtest;

	return (
		<Card
			className={cn(backgroundClass, "relative min-h-40 overflow-hidden border-0 p-4 shadow-md/20 hover:shadow-lg/20")}
		>
			{/* Lock overlay for premium content */}
			{isLocked && (
				<>
					{/* Dark overlay */}
					<div className="absolute inset-0 z-5 bg-black/40" />
					{/* Lock badge */}
					<div className="absolute top-4 left-4 z-10">
						<div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
							<LockKeyIcon size={16} className="text-white" weight="fill" />
							<span className="font-semibold text-white text-xs">Premium dulu yuk!</span>
						</div>
					</div>
				</>
			)}

			{/* Pattern element */}
			<div className={cn(patternClass, "absolute right-0 bottom-0 aspect-square h-[70%] w-auto")} />

			{/* Avatar image */}
			<div className="absolute right-13 bottom-0 aspect-square h-[170%] w-auto translate-x-1/2 translate-y-1/4">
				<Image
					src={avatarSrc}
					alt={`${subtest?.name} Avatar`}
					width={356}
					height={356}
					className="pointer-events-none select-none object-cover object-[50%_50%]"
				/>
			</div>
			<div className="flex h-full justify-between">
				<div className="mt-auto mb-0 w-1/2">
					<h3 className="text-pretty font-semibold">{subtest?.name}</h3>
					<p className="font-light text-sm"> {subtest?.totalContent} Konten</p>
				</div>

				{isLocked ? (
					// Disabled button for locked subtests
					<div
						className={cn(
							buttonVariants({ variant: "lightBlue", size: "icon" }),
							"z-10 mt-auto mb-0 cursor-not-allowed opacity-50",
						)}
					>
						<LockIcon size={18} weight="bold" />
					</div>
				) : (
					<Link
						to={isAdmin ? "/admin/classes/$shortName" : "/classes/$shortName"}
						params={{ shortName: subtest?.shortName?.toLowerCase() }}
						className={cn(buttonVariants({ variant: "lightBlue", size: "icon" }), "z-10 mt-auto mb-0")}
					>
						{isAdmin ? <PencilSimpleIcon size={18} weight="bold" /> : <ArrowRightIcon size={18} weight="bold" />}
					</Link>
				)}
			</div>
		</Card>
	);
}
