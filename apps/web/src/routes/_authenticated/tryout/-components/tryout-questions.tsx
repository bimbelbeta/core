import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { QuestionBody } from "./question-body";
import { QuestionFooter } from "./question-footer";
import { QuestionGrid } from "./question-grid";
import { QuestionHeader } from "./question-header";

type CountdownProps = {
	hours: string;
	minutes: string;
	seconds: string;
	isExpired: boolean;
};

interface TryoutQuestionsProps {
	countdownProps: CountdownProps;
}

export function TryoutQuestions({ countdownProps }: TryoutQuestionsProps) {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);

	const { data } = useQuery(
		orpc.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const {
		view,
		currentQuestion,
		currentQuestionIndex,
		setCurrentQuestionIndex,
		setCurrentQuestion,
		setEssayAnswer,
		setAnswer,
		setQuestions,
	} = useTryoutStore();

	const questions = data?.currentSubtest?.questions ?? [];
	const subtestId = data?.currentSubtest?.id;
	const hasInitialized = useRef(false);
	const prevTryoutId = useRef<number | null>(null);
	const prevSubtestId = useRef<number | null>(null);

	// Reset store when tryoutId changes (navigating between different tryouts)
	useEffect(() => {
		if (prevTryoutId.current !== null && prevTryoutId.current !== tryoutId) {
			useTryoutStore.getState().reset();
			hasInitialized.current = false;
		}
		prevTryoutId.current = tryoutId;
	}, [tryoutId]);

	// Reset refs when subtestId changes (moving to next subtest within same tryout)
	useEffect(() => {
		if (prevSubtestId.current !== null && prevSubtestId.current !== subtestId) {
			hasInitialized.current = false;
		}
		prevSubtestId.current = subtestId ?? null;
	}, [subtestId]);

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

		setQuestions(questions);

		const newRaguRaguIds = new Set<number>();
		questions.forEach((question) => {
			if (question.userAnswer?.essayAnswer) {
				setEssayAnswer(question.id, question.userAnswer.essayAnswer);
			}
			if (question.userAnswer?.selectedChoiceId) {
				setAnswer(question.id, question.userAnswer.selectedChoiceId);
			}
			if (question.userAnswer?.isDoubtful) {
				newRaguRaguIds.add(question.id);
			}
		});
		useTryoutStore.setState({ raguRaguIds: newRaguRaguIds });
	}, [questions, setEssayAnswer, setAnswer, setQuestions]);

	const showQuestionGrid = useTryoutStore((state) => state.showQuestionGrid);

	if (!data?.currentSubtest || !currentQuestion || view === "greeting") {
		return null;
	}

	return (
		<div className="flex gap-2 max-lg:flex-col-reverse">
			<Card className="flex flex-1 flex-col gap-4 p-4">
				<QuestionHeader countdownProps={countdownProps} />
				<QuestionBody />
				<QuestionFooter />
			</Card>
			{showQuestionGrid && <QuestionGrid />}
		</div>
	);
}
