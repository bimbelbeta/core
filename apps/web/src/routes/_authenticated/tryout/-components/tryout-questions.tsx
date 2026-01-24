import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import useCountdown from "@/lib/hooks/use-countdown";
import { orpc } from "@/utils/orpc";
import { useTryoutStore } from "../-hooks/use-tryout-store";
import { QuestionBody } from "./question-body";
import { QuestionFooter } from "./question-footer";
import { QuestionGrid } from "./question-grid";
import { QuestionHeader } from "./question-header";

export function TryoutQuestions() {
	const { tryoutId: stringTryoutId } = useParams({ from: "/_authenticated/tryout/$tryoutId" });
	const tryoutId = Number(stringTryoutId);
	const queryClient = useQueryClient();

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
		setView,
		setQuestions,
	} = useTryoutStore();

	const questions = data?.currentSubtest?.questions ?? [];
	const subtestId = data?.currentSubtest?.id;
	const deadline = data?.currentSubtest?.deadline ?? null;
	const hasInitialized = useRef(false);
	const hasAutoSubmitted = useRef(false);
	const prevTryoutId = useRef<number | null>(null);
	const prevSubtestId = useRef<number | null>(null);

	const [, hours, minutes, seconds] = useCountdown(deadline || 0);
	const isExpired = hours === "00" && minutes === "00" && seconds === "00" && deadline !== null;

	// Reset store when tryoutId changes (navigating between different tryouts)
	useEffect(() => {
		if (prevTryoutId.current !== null && prevTryoutId.current !== tryoutId) {
			useTryoutStore.getState().reset();
			hasInitialized.current = false;
			hasAutoSubmitted.current = false;
		}
		prevTryoutId.current = tryoutId;
	}, [tryoutId]);

	// Reset refs when subtestId changes (moving to next subtest within same tryout)
	useEffect(() => {
		if (prevSubtestId.current !== null && prevSubtestId.current !== subtestId) {
			hasInitialized.current = false;
			hasAutoSubmitted.current = false;
		}
		prevSubtestId.current = subtestId ?? null;
	}, [subtestId]);

	const submitSubtestMutation = useMutation(
		orpc.tryout.submitSubtest.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: orpc.tryout.find.key({ input: { id: tryoutId } }) });
				if (data.tryoutCompleted) {
					toast.success("Tryout selesai!");
				} else {
					toast.info("Waktu habis! Subtest otomatis dikumpulkan.");
				}
				setView("greeting");
			},
			onError: (error: Error) => {
				toast.error(error.message);
			},
		}),
	);

	// Auto-submit when timer expires
	useEffect(() => {
		if (isExpired && subtestId && !hasAutoSubmitted.current && !submitSubtestMutation.isPending) {
			hasAutoSubmitted.current = true;
			submitSubtestMutation.mutate({ tryoutId, subtestId });
		}
	}, [isExpired, subtestId, tryoutId, submitSubtestMutation]);

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

	if (!data?.currentSubtest || !currentQuestion || view === "greeting") {
		return null;
	}

	return (
		<div className="flex gap-2 max-lg:flex-col">
			<Card className="flex flex-1 flex-col gap-4 p-4">
				<QuestionHeader />
				<QuestionBody />
				<QuestionFooter />
			</Card>
			<QuestionGrid />
		</div>
	);
}
