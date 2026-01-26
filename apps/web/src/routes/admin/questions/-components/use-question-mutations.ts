import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export interface Choice {
	id: number;
	code: string;
	content: string;
	isCorrect: boolean;
}

interface UseQuestionMutationsProps {
	questionId?: number;
	initialChoices?: Choice[];
	allowMultipleCorrect?: boolean;
	onChoicesChange?: (choices: Choice[]) => void;
}

interface UseQuestionMutationsReturn {
	choices: Choice[];
	addChoice: () => void;
	updateChoice: (id: number, content: string, isCorrect: boolean) => void;
	deleteChoice: (id: number) => void;
	isAdding: boolean;
	isUpdating: number | null;
	isDeleting: number | null;
}

const CHOICE_CODES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export function useQuestionMutations({
	questionId,
	initialChoices = [],
	allowMultipleCorrect = false,
	onChoicesChange,
}: UseQuestionMutationsProps): UseQuestionMutationsReturn {
	const queryClient = useQueryClient();
	const [choices, setChoices] = useState<Choice[]>(initialChoices);
	const [isUpdating, setIsUpdating] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState<number | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Notify parent when choices change
	// biome-ignore lint/correctness/useExhaustiveDependencies: onChoicesChange is intentionally excluded to prevent infinite loops - parent component manages the callback and calling it on every re-render would cause unnecessary updates
	useEffect(() => {
		onChoicesChange?.(choices);
	}, [choices]);

	const updateChoiceMutation = useMutation(
		orpc.admin.tryout.questions.updateChoice.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: questionId
						? orpc.admin.tryout.questions.getQuestion.queryKey({ input: { id: questionId } })
						: undefined,
				});
				setIsUpdating(null);
			},
			onError: (err) => {
				toast.error(err.message);
				setIsUpdating(null);
			},
		}),
	);

	const createChoiceMutation = useMutation(
		orpc.admin.tryout.questions.createChoice.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: questionId
						? orpc.admin.tryout.questions.getQuestion.queryKey({ input: { id: questionId } })
						: undefined,
				});
				toast.success("Pilihan jawaban berhasil ditambahkan");
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const deleteChoiceMutation = useMutation(
		orpc.admin.tryout.questions.deleteChoice.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: questionId
						? orpc.admin.tryout.questions.getQuestion.queryKey({ input: { id: questionId } })
						: undefined,
				});
				setIsDeleting(null);
			},
			onError: (err) => {
				toast.error(err.message);
				setIsDeleting(null);
			},
		}),
	);

	const addChoice = useCallback(() => {
		if (questionId) {
			createChoiceMutation.mutate({
				questionId,
				content: "",
				isCorrect: false,
			});
		} else {
			const nextCode = CHOICE_CODES[choices.length];
			if (nextCode) {
				setChoices((prev) => [...prev, { id: -prev.length - 1, code: nextCode, content: "", isCorrect: false }]);
			}
		}
	}, [questionId, choices.length, createChoiceMutation]);

	const updateChoice = useCallback(
		(id: number, content: string, isCorrect: boolean) => {
			if (questionId && id > 0) {
				setIsUpdating(id);
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				if (isCorrect && !allowMultipleCorrect) {
					const currentCorrectChoice = choices.find((c) => c.isCorrect && c.id !== id);
					if (currentCorrectChoice) {
						updateChoiceMutation.mutate(
							{ id: currentCorrectChoice.id, content: currentCorrectChoice.content, isCorrect: false },
							{
								onSuccess: () => {
									updateChoiceMutation.mutate({ id, content, isCorrect: true });
								},
							},
						);
						return;
					}
				}

				timeoutRef.current = setTimeout(() => {
					updateChoiceMutation.mutate({ id, content, isCorrect });
				}, 500);
			} else {
				setChoices((prev) =>
					prev.map((c) => {
						if (c.id === id) {
							return { ...c, content, isCorrect };
						}
						// If the updated choice is marked as correct and we don't allow multiple correct answers,
						// we need to uncheck any other correct choices.
						if (isCorrect && !allowMultipleCorrect && c.isCorrect) {
							return { ...c, isCorrect: false };
						}
						return c;
					}),
				);
			}
		},
		[questionId, choices, updateChoiceMutation, allowMultipleCorrect],
	);

	const deleteChoice = useCallback(
		(id: number) => {
			if (questionId && id > 0) {
				setIsDeleting(id);
				deleteChoiceMutation.mutate({ id });
			} else {
				setChoices((prev) => prev.filter((c) => c.id !== id));
			}
		},
		[questionId, deleteChoiceMutation],
	);

	return {
		choices,
		addChoice,
		updateChoice,
		deleteChoice,
		isAdding: createChoiceMutation.isPending,
		isUpdating,
		isDeleting,
	};
}
