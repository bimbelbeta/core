export type QuestionType = "multiple_choice" | "multiple_choice_complex" | "essay";

export const QUESTION_TYPE_LABELS = {
	multiple_choice: "Pilihan Ganda",
	multiple_choice_complex: "Pilihan Ganda Kompleks",
	essay: "Esai",
} as const;

export const QUESTION_TYPE_SHORT_LABELS = {
	multiple_choice: "PG",
	multiple_choice_complex: "PGK",
	essay: "Esai",
} as const;

export const QUESTION_TYPE_BADGE_VARIANTS = {
	multiple_choice: "default",
	multiple_choice_complex: "secondary",
	essay: "outline",
} as const;

export function isQuestionType(v: string): v is QuestionType {
	return v === "multiple_choice" || v === "multiple_choice_complex" || v === "essay";
}

export function getQuestionTypeLabel(type: QuestionType, format: "full" | "short" = "full") {
	return format === "short" ? QUESTION_TYPE_SHORT_LABELS[type] : QUESTION_TYPE_LABELS[type];
}

export function getQuestionBadgeVariant(type: QuestionType) {
	return QUESTION_TYPE_BADGE_VARIANTS[type];
}
