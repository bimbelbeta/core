import { ArchiveIcon, EyeIcon, FileIcon } from "@phosphor-icons/react";
import { type } from "arktype";

export const subjectCategorySchema = type("'sd' | 'smp' | 'sma' | 'utbk'");

export const tryoutStatusSchema = type("'draft' | 'published' | 'archived'");

export type SubjectCategory = typeof subjectCategorySchema.infer;

export type TryoutStatus = typeof tryoutStatusSchema.infer;

export const SUBJECT_CATEGORY_LABELS: Record<SubjectCategory, string> = {
	sd: "SD",
	smp: "SMP",
	sma: "SMA",
	utbk: "UTBK",
};

export const TRYOUT_STATUS_BADGE = {
	draft: {
		label: "Draft",
		variant: "outline",
		dotClassName: "bg-gray-400",
		icon: FileIcon,
		iconClassName: "text-muted-foreground",
	},
	published: {
		label: "Published",
		variant: "success",
		dotClassName: "bg-green-500",
		icon: EyeIcon,
		iconClassName: "text-green-600",
	},
	archived: {
		label: "Archived",
		variant: "danger",
		dotClassName: "bg-red-500",
		icon: ArchiveIcon,
		iconClassName: "text-orange-600",
	},
} as const satisfies Record<
	TryoutStatus,
	{
		label: string;
		variant: "outline" | "success" | "danger";
		dotClassName: string;
		icon: React.ComponentType<{ className?: string }>;
		iconClassName: string;
	}
>;
