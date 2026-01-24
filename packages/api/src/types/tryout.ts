// Re-export question types for backward compatibility
// Keep the deprecated QuestionChoice alias for backward compatibility
// TODO: Remove in future version
export type {
	Choice,
	Choice as QuestionChoice,
	ChoiceWithAnswer,
	ReviewQuestion,
	TryoutQuestion,
	UserAnswer,
} from "./question";

export type TryoutSubtestWithStatus = {
	id: number;
	title: string;
	description: string | null;
	duration: number;
	order: number;
	questions: import("./question").TryoutQuestion[];
	deadline: Date | null;
	status: "ongoing" | "finished";
};

export type TryoutFindResponse = {
	id: number;
	title: string;
	description: string | null;
	startsAt: Date | null;
	endsAt: Date | null;
	subtests: Array<{
		id: number;
		title: string;
		description: string | null;
		duration: number;
		order: number;
	}>;
	attempt: {
		id: number;
		status: "ongoing" | "finished";
		startedAt: Date;
		completedAt: Date | null;
	} | null;
	currentSubtest: TryoutSubtestWithStatus | null;
	overallDeadline: Date | null;
	totalSubtests: number;
	completedSubtests: number;
};
