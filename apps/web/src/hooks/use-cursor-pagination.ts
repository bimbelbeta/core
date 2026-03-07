import { useCallback, useState } from "react";

export interface UseCursorPaginationOptions<TCursor> {
	urlCursor?: TCursor | undefined;
	onCursorChange?: (cursor: TCursor | undefined) => void;
	initialCursor?: TCursor;
	pageSize?: number;
}

export interface UseCursorPaginationReturn<TCursor> {
	cursorStack: TCursor[];
	currentCursor: TCursor | undefined;
	pageSize: number;
	setPageSize: (size: number) => void;
	handleNext: (nextCursor: TCursor) => void;
	handlePrevious: () => void;
	reset: () => void;
	canGoNext: boolean;
	canGoPrevious: boolean;
	setCanGoNext: (canGo: boolean) => void;
}

export function useCursorPagination<TCursor = number>(
	options: UseCursorPaginationOptions<TCursor> = {},
): UseCursorPaginationReturn<TCursor> {
	const [cursorStack, setCursorStack] = useState<TCursor[]>([]);
	const [canGoNext, setCanGoNext] = useState(false);
	const [pageSize, setPageSize] = useState(options.pageSize ?? 10);

	const currentCursor =
		options.urlCursor ?? (cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : options.initialCursor);

	const handleNext = useCallback(
		(nextCursor: TCursor) => {
			setCursorStack((prev) => [...prev, currentCursor as TCursor]);
			options.onCursorChange?.(nextCursor);
		},
		[currentCursor, options.onCursorChange],
	);

	const handlePrevious = useCallback(() => {
		if (cursorStack.length === 0) return;
		const prev = [...cursorStack];
		prev.pop();
		setCursorStack(prev);
		const previousCursor = prev.length > 0 ? prev[prev.length - 1] : options.initialCursor;
		options.onCursorChange?.(previousCursor);
	}, [cursorStack, options.onCursorChange, options.initialCursor]);

	const reset = useCallback(() => {
		setCursorStack([]);
		setCanGoNext(false);
		options.onCursorChange?.(options.initialCursor);
	}, [options.onCursorChange, options.initialCursor]);

	const canGoPrevious = cursorStack.length > 0;

	return {
		cursorStack,
		currentCursor,
		pageSize,
		setPageSize,
		handleNext,
		handlePrevious,
		reset,
		canGoNext,
		canGoPrevious,
		setCanGoNext,
	};
}
