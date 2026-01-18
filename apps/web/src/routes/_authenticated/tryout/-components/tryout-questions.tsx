import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
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

	const { view, currentQuestionIndex, setCurrentQuestion } = useTryoutStore();

	const questions = data?.currentSubtest?.questions ?? [];

	useEffect(() => {
		if (currentQuestionIndex >= questions.length) {
			setCurrentQuestion(questions.length - 1);
		}
	}, [questions.length, currentQuestionIndex, setCurrentQuestion]);

	const currentQuestion = questions[currentQuestionIndex];

	if (!data?.currentSubtest || !currentQuestion || view === "greeting") {
		return null;
	}

	return (
		<Card className="flex flex-col gap-4 p-4">
			<QuestionHeader />
			<QuestionBody question={currentQuestion} />
			<QuestionFooter />
		</Card>
	);
}
