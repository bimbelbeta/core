export type QuestionChoice = {
	id: number;
	content: string;
	code: string;
	contentJson: unknown | null;
};

export type TryoutQuestion = {
	id: number;
	content: string;
	contentJson: unknown | null;
	type: "multiple_choice" | "essay";
	choices: QuestionChoice[];
	userAnswer: {
		selectedChoiceId: number | null;
		essayAnswer: string | null;
		essayAnswerJson: unknown | null;
	};
};
