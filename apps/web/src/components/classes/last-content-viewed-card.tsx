import { CaretRightIcon, NoteIcon, PlayCircleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
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
		className: (completed?: boolean | null) =>
			completed ? "bg-neutral-100 text-neutral-1000 border-[0.5px] border-black" : "bg-secondary-100",
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

export function LastContentViewedCard({
	item,
	index,
	shortName: shortNameProp,
	subjectId: subjectIdProp,
}: {
	item: LastContentViewedItem;
	index: number;
	shortName?: string;
	subjectId?: number;
}) {
	const isAdmin = useIsAdmin();
	const basePath = isAdmin ? "/admin/classes" : "/classes";
	const subjectIdParam = (subjectIdProp ?? 0).toString();
	const subjectLabel = shortNameProp ?? String(subjectIdProp ?? "");

	const params = {
		subjectId: subjectIdParam,
		contentId: item.id.toString(),
	};

	return (
		<Card className="relative gap-3 rounded-xl border border-border/50 p-3 shadow-sm sm:gap-6 sm:p-4 lg:p-5">
			{/* Header */}
			<div className="flex flex-row justify-between gap-3 sm:items-start">
				{/* Left: badge + title */}
				<div className="flex items-start gap-3">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm shadow-sm sm:size-9">
						{index + 1}
					</div>

					<div className="flex h-full items-center pt-0.5">
						<p className="mr-7 font-bold text-neutral-1000 text-sm sm:text-base lg:text-lg">{item.title}</p>
					</div>
				</div>

				{/* Right: subject label */}
				<div className="flex items-start gap-2 sm:flex-col sm:items-end">
					{subjectLabel && <span className="text-muted-foreground text-xs uppercase">{subjectLabel}</span>}
				</div>
			</div>

			{/* Actions */}
			<div className="mt-2 flex gap-2 overflow-x-auto sm:gap-3">
				{DASHBOARD_CONTENT_ACTIONS.filter(({ enabled }) => enabled(item)).map(
					({ key, label, icon: Icon, className, width }) => {
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
								)}
							>
								<Icon className="size-4 sm:size-[18px]" weight="bold" />
								<span className="whitespace-nowrap font-medium text-xs sm:text-[14px]">{label}</span>
								<CaretRightIcon className="ml-auto size-4 sm:size-[18px]" weight="bold" />
							</Link>
						);
					},
				)}
			</div>
		</Card>
	);
}
