export function encodeCursor(cursor: string): string {
	return Buffer.from(cursor).toString("base64url");
}

export function decodeCursor(encoded: string): string {
	return Buffer.from(encoded, "base64url").toString("utf-8");
}

export function createDateCursor(date: Date): string {
	return encodeCursor(date.toISOString());
}

export function parseDateCursor(cursor: string): Date {
	return new Date(decodeCursor(cursor));
}

export function createIdCursor(id: number): string {
	return encodeCursor(id.toString());
}

export function parseIdCursor(cursor: string): number {
	return Number.parseInt(decodeCursor(cursor), 10);
}

export interface IdCursorPageInfo {
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	startCursor: string | null;
	endCursor: string | null;
}

/**
 * Applies the standard id-cursor pagination post-processing: slices the extra
 * sentinel item, reverses backward results, and builds the pageInfo object.
 * Callers must fetch `limit + 1` rows to enable hasExtra detection.
 */
export function buildIdCursorPage<T extends { id: number }>(
	rows: T[],
	limit: number,
	isBackward: boolean,
	hasCursor: boolean,
): { items: T[]; pageInfo: IdCursorPageInfo } {
	const hasExtra = rows.length > limit;
	let items = hasExtra ? rows.slice(0, limit) : rows;
	if (isBackward) items = items.slice().reverse();

	const firstItem = items[0];
	const lastItem = items[items.length - 1];

	return {
		items,
		pageInfo: {
			hasNextPage: isBackward ? true : hasExtra,
			hasPreviousPage: isBackward ? hasExtra : hasCursor,
			startCursor: firstItem ? createIdCursor(firstItem.id) : null,
			endCursor: lastItem ? createIdCursor(lastItem.id) : null,
		},
	};
}
