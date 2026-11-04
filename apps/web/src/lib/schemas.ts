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
	draft: { label: "Draft", variant: "outline" },
	published: { label: "Published", variant: "success" },
	archived: { label: "Archived", variant: "danger" },
} as const satisfies Record<TryoutStatus, { label: string; variant: "outline" | "success" | "danger" }>;
