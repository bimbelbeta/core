export interface SubtestScoreResult {
	subtestAttemptId: number;
	subtestId: number;
	score: number;
	correct: number;
	total: number;
}

export interface TryoutScoreResult {
	subtests: SubtestScoreResult[];
	totalScore: number;
}

export function getScoreFromMap(
	scoringMap: Record<string, number> | null | undefined,
	correctCount: number,
	totalCount: number,
): number {
	const mappedScore = scoringMap?.[correctCount.toString()];
	if (mappedScore !== undefined) {
		return mappedScore;
	}
	if (totalCount === 0) return 0;
	return Math.round((correctCount / totalCount) * 1000);
}

export function scoreMultipleChoice(isCorrect: boolean | null | undefined): boolean {
	return !!isCorrect;
}

export function scoreComplexChoice(selectedIds: number[], choices: Array<{ id: number; isCorrect: boolean }>): boolean {
	const correctChoiceIds = choices.filter((c) => c.isCorrect).map((c) => c.id);
	const selectedIncorrectChoices = selectedIds.filter((id) => !correctChoiceIds.includes(id));
	const allCorrectSelected = correctChoiceIds.every((id) => selectedIds.includes(id));
	const noIncorrectSelected = selectedIncorrectChoices.length === 0;
	return allCorrectSelected && noIncorrectSelected;
}

export function scoreEssay(userAnswer: string | null | undefined, correctAnswer: string | null | undefined): boolean {
	const userEssay = userAnswer?.trim().toLowerCase() ?? "";
	const correctEssay = correctAnswer?.trim().toLowerCase() ?? "";
	return !!(userEssay && correctEssay && userEssay === correctEssay);
}

export function calcTotalScore(scores: number[]): number {
	if (scores.length === 0) return 0;
	return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

export interface SubtestMaxScoreInput {
	scoringMap: Record<string, number> | null | undefined;
	questionCount: number;
}

export function calcTryoutMaxScore(subtests: SubtestMaxScoreInput[]): number {
	return calcTotalScore(
		subtests
			.filter((subtest) => subtest.questionCount > 0)
			.map((subtest) => getScoreFromMap(subtest.scoringMap, subtest.questionCount, subtest.questionCount)),
	);
}
