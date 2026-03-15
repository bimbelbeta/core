type PageInfo =
	| {
			endCursor?: string | null;
			startCursor?: string | null;
			hasNextPage?: boolean;
			hasPreviousPage?: boolean;
	  }
	| null
	| undefined;

type NavigateFn = (opts: { search: Record<string, unknown> }) => void;

/**
 * Returns handleNext/handlePrevious cursor-based pagination handlers.
 * Pass baseParams containing all active filter/search/limit params (without after/before).
 */
export function usePaginationNavigation(navigate: NavigateFn, pageInfo: PageInfo, baseParams: Record<string, unknown>) {
	const handleNext = () => {
		if (!pageInfo?.endCursor) return;
		navigate({ search: { after: pageInfo.endCursor, ...baseParams } });
	};

	const handlePrevious = () => {
		if (!pageInfo?.startCursor) return;
		navigate({ search: { before: pageInfo.startCursor, ...baseParams } });
	};

	return { handleNext, handlePrevious };
}
