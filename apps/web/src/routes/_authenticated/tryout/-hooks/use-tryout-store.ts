import type { TryoutQuestion } from "@bimbelbeta/api/types/tryout";
import { create } from "zustand";

interface TryoutStore {
	view: "greeting" | "questions";
	currentQuestion: TryoutQuestion | null;
	currentQuestionIndex: number;
	answers: Record<number, number>;
	raguRaguIds: Set<number>;

	setView: (view: "greeting" | "questions") => void;
	setCurrentQuestion: (question: TryoutQuestion | null) => void;
	setCurrentQuestionIndex: (index: number) => void;
	setAnswer: (questionId: number, choiceId: number) => void;
	removeAnswer: (questionId: number) => void;
	toggleRaguRagu: (questionId: number) => void;
	nextQuestion: () => void;
	prevQuestion: () => void;
	reset: () => void;
}

export const useTryoutStore = create<TryoutStore>((set, _get) => ({
	view: "greeting",
	currentQuestion: null,
	currentQuestionIndex: 0,
	answers: {},
	raguRaguIds: new Set(),

	setView: (view) => set({ view }),

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
			currentQuestion: null,
			currentQuestionIndex: 0,
			answers: {},
			raguRaguIds: new Set(),
		}),
}));
