import {
	CaretRightIcon,
	CheckCircleIcon,
	DotsNineIcon,
	LockIcon,
	NoteIcon,
	PencilSimpleIcon,
	PlayCircleIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { Link, useLocation } from "@tanstack/react-router";
import type { useDragControls } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { canAccessContent } from "@/lib/premium-config";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/utils/is-admin";
import type { ContentActionItem, ContentListItem } from "./classes-types";

const CONTENT_ACTIONS = [
	{
		key: "video",
		label: "Video Materi",
		icon: PlayCircleIcon,
		enabled: (i: ContentActionItem) => i.hasVideo,
		className: (completed?: boolean | null) => (completed ? "bg-neutral-100 text-neutral-1000" : "bg-secondary-100"),
		width: "w-fit",
	},
	{
		key: "notes",
		label: "Catatan Materi",
		icon: NoteIcon,
		enabled: (i: ContentActionItem) => i.hasNote,
		className: (completed?: boolean | null) =>
			completed ? "bg-green-100 text-green-700" : "bg-tertiary-500 text-neutral-100",
		width: "w-fit",
	},
	{
		key: "latihan-soal",
		label: "Latihan Soal",
		icon: NoteIcon,
		enabled: (i: ContentActionItem) => i.hasPracticeQuestions,
		className: (completed?: boolean | null) =>
			completed ? "bg-green-100 text-green-700" : "bg-primary-100 text-neutral-1000",
		width: "w-fit",
	},
] as const;

export function ContentCard({
	item,
	index,
	onEdit,
	onDelete,
	completed,
	dragControls,
	userIsPremium,
	userRole,
	subjectId,
	subtestOrder,
}: {
	item: ContentListItem;
	index: number;
	onEdit?: () => void;
	onDelete?: () => void;
	completed?: boolean;
	dragControls?: ReturnType<typeof useDragControls>;
	userIsPremium?: boolean;
	userRole?: string;
	subjectId?: number;
	subtestOrder?: number;
}) {
	const isAdmin = useIsAdmin();
	const location = useLocation();
	const basePath = isAdmin ? "/admin/classes" : "/classes";
	const subjectIdIndex = isAdmin ? 3 : 2;
	const subtestSubjectId = subjectId || Number(location.pathname.split("/")[subjectIdIndex]) || 0;
	// Use canAccessContent to determine if this content is premium locked
	// item.order is = content order (1-based), subtestOrder is = subtest order
	const isPremiumContent =
		!isAdmin && !canAccessContent(userIsPremium ?? false, userRole, subtestOrder ?? 1, item.order);

	const params = {
		subjectId: subtestSubjectId.toString(),
		contentId: item.id.toString(),
	};

	return (
		<Card
			className={cn(
				"relative gap-3 rounded-xl border border-border/50 p-3 shadow-sm transition-all duration-300 sm:gap-6 sm:p-4 lg:p-5",
				!isAdmin && completed && "border-neutral-200 bg-secondary-100",
				isPremiumContent ? "overflow-hidden opacity-90" : "hover:border-primary/50 hover:shadow-md",
			)}
		>
			{/* Premium lock overlay */}
			{isPremiumContent && (
				<>
					{/* Dark overlay */}
					<div className="pointer-events-none absolute inset-0 z-10 bg-black/10 backdrop-blur-[1px]" />
					{/* Lock badge */}
					<div className="absolute top-2 right-2 z-20 sm:top-3 sm:right-3">
						<div className="flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 backdrop-blur-sm">
							<LockIcon className="size-4 text-white" weight="fill" />
							<span className="font-semibold text-white text-xs">Premium</span>
						</div>
					</div>
				</>
			)}

			{/* Completed indicator */}
			{!isAdmin && completed && !isPremiumContent && (
				<div className="absolute top-2 right-2 sm:top-3 sm:right-3">
					<CheckCircleIcon className="size-5 text-green-200 sm:size-6" weight="fill" />
				</div>
			)}

			{/* Header */}
			<div className="flex flex-row justify-between gap-3 sm:items-start">
				{/* Left: drag handle + badge + title */}
				<div className="flex items-start gap-3">
					{/* Drag Handle - only for admin */}
					{isAdmin && dragControls && (
						<div
							className="mt-0.5 flex size-8 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:cursor-grabbing"
							onPointerDown={(e) => dragControls.start(e)}
						>
							<DotsNineIcon className="size-6" weight="bold" />
						</div>
					)}
					<div
						className={cn(
							"flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-primary text-sm shadow-sm sm:size-9",
							completed ? "bg-neutral-100 text-neutral-1000" : "bg-primary/10",
						)}
					>
						{index + 1}
					</div>

					<div className="flex h-full items-center pt-0.5">
						<p className="mr-7 font-bold text-neutral-1000 text-sm sm:text-base lg:text-lg">{item.title}</p>
					</div>
				</div>

				{/* Right: admin actions (tanpa move up/down) */}
				<div className="flex items-start gap-2 sm:flex-col sm:items-end">
					{isAdmin && (onEdit || onDelete) && (
						<div className="flex items-center gap-1">
							{onEdit && (
								<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onEdit}>
									<PencilSimpleIcon className="size-4 lg:size-5" />
								</Button>
							)}

							{onDelete && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
									onClick={onDelete}
								>
									<TrashIcon className="size-4 lg:size-5" />
								</Button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Actions - Links still work but will be caught by route guard */}
			<div className="mt-2 flex gap-2 overflow-x-auto sm:gap-3">
				{CONTENT_ACTIONS.filter(({ enabled }) => enabled(item)).map(({ key, label, icon: Icon, className, width }) => {
					const completed = item[`${key}Completed` as keyof ContentActionItem] as boolean | undefined;
					return (
						<Link
							key={key}
							to={`${basePath}/$subjectId/$contentId/${key}`}
							params={params}
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5",
								"w-full sm:w-auto",
								className(completed),
								width,
								isPremiumContent && "pointer-events-none opacity-60",
							)}
						>
							<Icon className="size-4 sm:size-[18px]" weight="bold" />
							<span className="whitespace-nowrap font-medium text-xs sm:text-[14px]">{label}</span>
							<CaretRightIcon className="ml-auto size-4 sm:size-[18px]" weight="bold" />
						</Link>
					);
				})}
			</div>
		</Card>
	);
}
