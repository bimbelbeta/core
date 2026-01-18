import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { QuestionCard } from "./question-card";

interface TryoutQuestionsProps {
	tryoutId: number;
}

export function TryoutQuestions({ tryoutId }: TryoutQuestionsProps) {
	const { data } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const { currentQuestionIndex, setCurrentQuestion } = useTryoutStore();

	const questions = data?.currentSubtest?.questions ?? [];
	const deadline = data?.currentSubtest?.deadline ?? null;

	useEffect(() => {
		if (currentQuestionIndex >= questions.length) {
			setCurrentQuestion(questions.length - 1);
		}
	}, [questions.length, currentQuestionIndex, setCurrentQuestion]);

	const currentQuestion = questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === questions.length - 1;

	if (!data?.currentSubtest || !currentQuestion) {
		return null;
	}

	return (
		<QuestionCard
			tryoutId={tryoutId}
			subtestId={data.currentSubtest.id}
			question={currentQuestion}
			currentIndex={currentQuestionIndex}
			totalQuestions={questions.length}
			isLastQuestion={isLastQuestion}
			deadline={deadline}
		/>
	);
}
