import type { TryoutQuestion } from "@bimbelbeta/api/types/tryout";
import { create } from "zustand";

interface TryoutStore {
	view: "greeting" | "questions";
	questions: TryoutQuestion[];
	currentQuestion: TryoutQuestion | null;
	currentQuestionIndex: number;
	answers: Record<number, number>;
	essayAnswers: Record<number, string>;
	raguRaguIds: Set<number>;
	showQuestionGrid: boolean;

	setView: (view: "greeting" | "questions") => void;
	setQuestions: (questions: TryoutQuestion[]) => void;
	setCurrentQuestion: (question: TryoutQuestion | null) => void;
	setCurrentQuestionIndex: (index: number) => void;
	setAnswer: (questionId: number, choiceId: number) => void;
	setEssayAnswer: (questionId: number, answer: string) => void;
	removeAnswer: (questionId: number) => void;
	toggleRaguRagu: (questionId: number) => void;
	setShowQuestionGrid: (show: boolean) => void;
	toggleQuestionGrid: () => void;
	nextQuestion: () => void;
	prevQuestion: () => void;
	reset: () => void;
}

export const useTryoutStore = create<TryoutStore>((set, _get) => ({
	view: "greeting",
	questions: [],
	currentQuestion: null,
	currentQuestionIndex: 0,
	answers: {},
	essayAnswers: {},
	raguRaguIds: new Set(),
	showQuestionGrid: false,

	setView: (view) => set({ view }),

	setQuestions: (questions) => set({ questions }),

	setCurrentQuestion: (question) =>
		set((state) => {
			if (state.currentQuestion?.id === question?.id) return {};
			return { currentQuestion: question };
		}),

	setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

	setAnswer: (questionId, choiceId) =>
		set((state) => ({
			answers: { ...state.answers, [questionId]: choiceId },
		})),

	setEssayAnswer: (questionId, answer) =>
		set((state) => ({
			essayAnswers: { ...state.essayAnswers, [questionId]: answer },
		})),

	removeAnswer: (questionId) =>
		set((state) => {
			const { [questionId]: _, ...rest } = state.answers;
			return { answers: rest };
		}),

	toggleRaguRagu: (questionId) =>
		set((state) => {
			const newRaguRaguIds = new Set(state.raguRaguIds);
			if (newRaguRaguIds.has(questionId)) {
				newRaguRaguIds.delete(questionId);
			} else {
				newRaguRaguIds.add(questionId);
			}
			return { raguRaguIds: newRaguRaguIds };
		}),

	setShowQuestionGrid: (show) => set({ showQuestionGrid: show }),

	toggleQuestionGrid: () => set((state) => ({ showQuestionGrid: !state.showQuestionGrid })),

	nextQuestion: () =>
		set((state) => ({
			currentQuestionIndex: state.currentQuestionIndex + 1,
		})),

	prevQuestion: () =>
		set((state) => ({
			currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
		})),

	reset: () =>
		set({
			view: "greeting",
			questions: [],
			currentQuestion: null,
			currentQuestionIndex: 0,
			answers: {},
			essayAnswers: {},
			raguRaguIds: new Set(),
			showQuestionGrid: true,
		}),
}));
