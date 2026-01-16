export type Question = {
	id: number;
	order: number;
	content: Record<string, unknown>;
	discussion: Record<string, unknown>;
	selectedAnswerId: number | null;
	answers: Answer[];
};

export type Answer = {
	id: number;
	content: string;
	isCorrect?: boolean;
};
