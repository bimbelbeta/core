import { useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import type { BodyOutputs } from "@/utils/orpc";
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
	data: NonNullable<BodyOutputs["tryout"]["find"]>;
}

export function TryoutQuestions({ countdownProps, data }: TryoutQuestionsProps) {
	const { tryoutId: rawTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = parseRouteParamToNumber(rawTryoutId);
	const {
		view,
		currentQuestion,
		currentQuestionIndex,
		setCurrentQuestionIndex,
		setCurrentQuestion,
		setComplexAnswer,
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

	useEffect(() => {
		setQuestions(questions);
	}, [questions, setQuestions]);

	// Sync saved essay answers from API to store (once on mount)
	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;

		const newRaguRaguIds = new Set<number>();
		questions.forEach((question) => {
			if (question.userAnswer?.essayAnswer) {
				setEssayAnswer(question.id, question.userAnswer.essayAnswer);
			}
			if (question.userAnswer?.selectedChoiceId) {
				setAnswer(question.id, question.userAnswer.selectedChoiceId);
			}
			if ((question.userAnswer?.selectedChoiceIds?.length ?? 0) > 0) {
				setComplexAnswer(question.id, question.userAnswer.selectedChoiceIds ?? []);
			}
			if (question.userAnswer?.isDoubtful) {
				newRaguRaguIds.add(question.id);
			}
		});
		useTryoutStore.setState({ raguRaguIds: newRaguRaguIds });
	}, [questions, setComplexAnswer, setEssayAnswer, setAnswer]);

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
