// Re-export from unified question types
// Use PracticeQuestion for practice pack context
// Backward compatibility aliases
// TODO: Remove in future version - use PracticeQuestion and ChoiceWithAnswer instead
export type { ChoiceWithAnswer, PracticeQuestion, PracticeQuestion as Question } from "./question";

/**
 * @deprecated Use ChoiceWithAnswer from "./question" instead
 * Kept for backward compatibility with 'answers' naming convention
 */
export type Answer = {
	id: number;
	content: string;
	isCorrect?: boolean;
};
