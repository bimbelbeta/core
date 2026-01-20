import { ArrowRightIcon, LockIcon, LockKeyIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { isSubjectPremium } from "@/lib/premium-config";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/utils/is-admin";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import type { SubjectListItem } from "./classes-types";

export function SubjectCard({ subject }: { subject: SubjectListItem }) {
	const isAdmin = useIsAdmin();
	const role = isAdmin ? "admin" : "user";
	const isPremiumSubject = isSubjectPremium(subject?.order ?? 1, role, false);
	const isLocked = !isAdmin && isPremiumSubject;

	return (
		<Card
			className={cn(
				"relative h-auto overflow-hidden border border-neutral-200 bg-white p-4 shadow-md transition-colors duration-500 hover:border-primary-300 hover:shadow-md/20",
			)}
		>
			{/* Lock overlay for premium content */}
			{isLocked && (
				<>
					{/* Dark overlay */}
					<div className="absolute inset-0 z-5 bg-black/40" />
					{/* Lock badge */}
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 transition-opacity duration-300">
						<div className="flex items-center justify-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
							<LockKeyIcon size={16} className="text-white" weight="fill" />
							<span className="font-semibold text-white text-xs">Premium dulu yuk!</span>
						</div>
					</div>
				</>
			)}
			<div className="flex h-full justify-between">
				<div className="my-auto w-1/2">
					<h3 className="text-pretty font-semibold text-lg leading-tight xl:text-2xl">{subject?.name}</h3>
					{/*<p className="font-light text-sm"> {subject?.totalContent} Konten</p>*/}

					{subject.category === "utbk" ? (
						<p className="font-light text-sm">SMA Kelas 12</p>
					) : (
						<p className="font-light text-sm">
							<span className="uppercase">{subject.category}</span> Kelas {subject.gradeLevel ?? "-"}
						</p>
					)}
				</div>

				{isLocked ? (
					// Disabled button for locked subjects
					<div className={cn(buttonVariants({ size: "icon" }), "z-10 mt-auto mb-0 cursor-not-allowed opacity-50")}>
						<LockIcon size={18} weight="bold" />
					</div>
				) : (
					<div className="flex flex-col items-end justify-between gap-y-4.5">
						<div className="space-x-3">
							{subject?.category && <Badge className="font-normal uppercase">{subject?.category}</Badge>}
							{subject.hasViewed && <Badge className="font-normal">Sudah Pernah Dibuka</Badge>}
						</div>

						<Link
							to={isAdmin ? "/admin/classes/$subjectId" : "/classes/$subjectId"}
							params={{ subjectId: String(subject.id) }}
							className={cn(buttonVariants({ size: "icon" }), "z-10 mt-auto mb-0")}
						>
							{isAdmin ? <PencilSimpleIcon size={18} weight="bold" /> : <ArrowRightIcon size={18} weight="bold" />}
						</Link>
					</div>
				)}
			</div>
		</Card>
	);
}
