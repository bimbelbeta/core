import { ArchiveIcon, CalendarIcon, ClockIcon, CreditCardIcon, EyeIcon, FileIcon } from "@phosphor-icons/react";
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
		iconClassName: "text-red-600",
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

export const questionTypeSchema = type("'multiple_choice' | 'multiple_choice_complex' | 'essay'");

export type QuestionType = typeof questionTypeSchema.infer;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
	multiple_choice: "Pilihan Ganda",
	multiple_choice_complex: "Pilihan Ganda Kompleks",
	essay: "Esai",
};

export const productVariantSchema = type("'fixed_date' | 'monthly' | 'credits'");

export type ProductVariant = typeof productVariantSchema.infer;

export const isSubscriptionVariant = (variant: ProductVariant) => variant !== "credits";

export const productTypeSchema = type("'subscription' | 'product'");

export type ProductType = typeof productTypeSchema.infer;

export const variantConfig = {
	fixed_date: {
		label: "Fixed Date",
		icon: CalendarIcon,
		iconColor: "text-purple-500",
		bgColor: "bg-purple-100",
	},
	monthly: {
		label: "Monthly",
		icon: ClockIcon,
		iconColor: "text-blue-500",
		bgColor: "bg-blue-100",
	},
	credits: {
		label: "Credits",
		icon: CreditCardIcon,
		iconColor: "text-green-700",
		bgColor: "bg-green-100",
	},
} as const;

export const QUESTION_TYPE_BADGE = {
	multiple_choice: "default",
	multiple_choice_complex: "secondary",
	essay: "outline",
} as const satisfies Record<QuestionType, "default" | "secondary" | "outline" | "destructive">;
