import { CaretRightIcon, ExamIcon, NoteIcon, PlayCircleIcon } from "@phosphor-icons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/utils/is-admin";
import type { ContentActionItem, LastContentViewedItem } from "./classes-types";

const DASHBOARD_CONTENT_ACTIONS = [
	{
		key: "video",
		label: "Video Materi",
		icon: PlayCircleIcon,
		enabled: (i: ContentActionItem) => i.hasVideo,
		className: "bg-secondary-100 text-black hover:bg-secondary-200",
		width: "w-fit",
	},
	{
		key: "notes",
		label: "Catatan Materi",
		icon: NoteIcon,
		enabled: (i: ContentActionItem) => i.hasNote,
		className: "bg-tertiary-500 text-white hover:bg-tertiary-600",
		width: "w-fit",
	},
	{
		key: "latihan-soal",
		label: "Quiz",
		icon: ExamIcon,
		enabled: (i: ContentActionItem) => i.hasPracticeQuestions,
		className: "bg-primary-100 text-black hover:bg-primary-200",
		width: "w-fit",
	},
] as const;

export function LastContentViewedCard({
	item,
	index,
	shortName: shortNameProp,
}: {
	item: LastContentViewedItem;
	index: number;
	shortName?: string;
}) {
	const isAdmin = useIsAdmin();
	const location = useLocation();
	const basePath = isAdmin ? "/admin/classes" : "/classes";
	const shortNameIndex = isAdmin ? 3 : 2;
	const shortNameFromPath = location.pathname.split("/")[shortNameIndex] || "";
	const shortName = shortNameProp || shortNameFromPath;

	const params = {
		shortName: shortName.toLowerCase(),
		contentId: item.id.toString(),
	};

	return (
		<Card className="rounded-[10px] border border-neutral-200 p-4 sm:p-5">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				{/* Left: badge + title */}
				<div className="flex items-start gap-3">
					<div className="flex h-7 w-8 shrink-0 items-center justify-center rounded border border-neutral-200">
						<p className="font-medium text-[12px] text-primary-300">{index + 1}</p>
					</div>

					<p className="font-medium text-[18px] text-neutral-1000 sm:text-[20px]">{item.title}</p>
				</div>

				{/* Right: label + admin actions */}
				<div className="flex items-center gap-2 sm:flex-col sm:items-end">
					{shortName && <span className="text-muted-foreground text-xs">{shortName}</span>}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 overflow-x-auto">
				{DASHBOARD_CONTENT_ACTIONS.map(
					({ key, label, icon: Icon, enabled, className, width }) =>
						enabled(item) && (
							<Link
								key={key}
								to={`${basePath}/$shortName/$contentId/${key}`}
								params={params}
								className={cn(
									"flex items-center gap-2 rounded-[5px] px-4 py-2.5 transition-opacity hover:opacity-90",
									"w-full sm:w-auto",
									className,
									width,
								)}
							>
								<Icon size={18} weight="bold" />
								<span className="whitespace-nowrap font-medium text-[14px]">{label}</span>
								<CaretRightIcon size={18} className="ml-auto" weight="bold" />
							</Link>
						),
				)}
			</div>
		</Card>
	);
}
