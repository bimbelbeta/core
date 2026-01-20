import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { QuestionBody } from "./question-body";
import { QuestionFooter } from "./question-footer";
import { QuestionHeader } from "./question-header";

export function TryoutQuestions() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const { data } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const { view, currentQuestion, currentQuestionIndex, setCurrentQuestionIndex, setCurrentQuestion, setEssayAnswer } =
		useTryoutStore();

	const questions = data?.currentSubtest?.questions ?? [];
	const hasInitialized = useRef(false);

	// Update stores when current index is past max
	useEffect(() => {
		if (questions.length > 0 && currentQuestionIndex >= questions.length) {
			setCurrentQuestionIndex(questions.length - 1);
		}
	}, [questions.length, currentQuestionIndex, setCurrentQuestionIndex]);

	// Update store to store current question information
	useEffect(() => {
		setCurrentQuestion(questions[currentQuestionIndex]);
	}, [questions, currentQuestionIndex, setCurrentQuestion]);

	// Sync saved essay answers from API to store (once on mount)
	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;

		questions.forEach((question) => {
			if (question.userAnswer?.essayAnswer) {
				setEssayAnswer(question.id, question.userAnswer.essayAnswer);
			}
		});
	}, [questions, setEssayAnswer]);

	if (!data?.currentSubtest || !currentQuestion || view === "greeting") {
		return null;
	}

	return (
		<Card className="flex flex-col gap-4 p-4">
			<QuestionHeader />
			<QuestionBody />
			<QuestionFooter />
		</Card>
	);
}
