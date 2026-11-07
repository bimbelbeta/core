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
		label: "Draf",
		variant: "outline",
		icon: FileIcon,
		iconClassName: "text-muted-foreground",
	},
	published: {
		label: "Terbit",
		variant: "success",
		icon: EyeIcon,
		iconClassName: "text-green-600",
	},
	archived: {
		label: "Arsip",
		variant: "danger",
		icon: ArchiveIcon,
		iconClassName: "text-red-600",
	},
} as const satisfies Record<
	TryoutStatus,
	{
		label: string;
		variant: "outline" | "success" | "danger";
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

export const QUESTION_TYPE_SHORT_LABELS: Record<QuestionType, string> = {
	multiple_choice: "Pilihan ganda",
	multiple_choice_complex: "PG kompleks",
	essay: "Esai",
};

export const productVariantSchema = type("'fixed_date' | 'monthly' | 'credits'");

export type ProductVariant = typeof productVariantSchema.infer;

export const isSubscriptionVariant = (variant: ProductVariant) => variant !== "credits";

export const productTypeSchema = type("'subscription' | 'product'");

export type ProductType = typeof productTypeSchema.infer;

export const variantConfig = {
	fixed_date: {
		label: "Tanggal tetap",
		icon: CalendarIcon,
	},
	monthly: {
		label: "Bulanan",
		icon: ClockIcon,
	},
	credits: {
		label: "Kredit",
		icon: CreditCardIcon,
	},
} as const;

export const QUESTION_TYPE_BADGE = {
	multiple_choice: "default",
	multiple_choice_complex: "secondary",
	essay: "outline",
} as const satisfies Record<QuestionType, "default" | "secondary" | "outline" | "destructive">;
