export type QuestionChoice = {
	id: number;
	content: string;
	code: string;
};

export type TryoutQuestion = {
	id: number;
	content: unknown;
	type: "multiple_choice" | "essay";
	choices: QuestionChoice[];
	userAnswer: {
		selectedChoiceId: number | null;
		essayAnswer: string | null;
	};
};

export type TryoutSubtestWithStatus = {
	id: number;
	title: string;
	description: string | null;
	duration: number;
	order: number;
	questions: TryoutQuestion[];
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
