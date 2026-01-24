/**
 * Unified Question and Choice types used across the application.
 * These types are shared between tryout, practice, and review contexts.
 */

/**
 * Base choice without correctness info.
 * Used during active tryout attempts where correct answers should not be exposed.
 */
export type Choice = {
	id: number;
	content: string;
	code: string;
};

/**
 * Choice with correctness info.
 * Used for review and practice contexts where answers are revealed.
 */
export type ChoiceWithAnswer = Choice & {
	isCorrect: boolean;
};

/**
 * User's answer state for a question in tryout context.
 */
export type UserAnswer = {
	selectedChoiceId: number | null;
	essayAnswer: string | null;
	isDoubtful: boolean;
};

/**
 * Base question structure shared across all question types.
 */
export type BaseQuestion = {
	id: number;
	content: unknown;
	type: "multiple_choice" | "essay";
};

/**
 * Question for active tryout attempts.
 * Does not expose correct answers to prevent cheating.
 */
export type TryoutQuestion = BaseQuestion & {
	choices: Choice[];
	userAnswer: UserAnswer;
};

/**
 * Question for review context after tryout completion.
 * Includes correct answers and discussion.
 */
export type ReviewQuestion = BaseQuestion & {
	choices: ChoiceWithAnswer[];
	userAnswer: UserAnswer;
	discussion: unknown;
};

/**
 * Question for practice content within learning materials.
 * Includes order for sequencing and exposes correct answers.
 */
export type PracticeQuestion = {
	id: number;
	order: number;
	content: unknown;
	discussion: unknown;
	choices: ChoiceWithAnswer[];
	selectedChoiceId: number | null;
};
