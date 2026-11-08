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
	const decoded = decodeCursor(cursor);
	const date = new Date(decoded);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date cursor: ${decoded}`);
	}
	return date;
}

export function createIdCursor(id: number): string {
	return encodeCursor(id.toString());
}

export function parseIdCursor(cursor: string): number {
	const id = Number.parseInt(decodeCursor(cursor), 10);
	if (Number.isNaN(id)) {
		throw new Error(`Invalid id cursor: ${decodeCursor(cursor)}`);
	}
	return id;
}

export function createStringIdCursor(id: string): string {
	return encodeCursor(id);
}

export function parseStringIdCursor(cursor: string): string {
	return decodeCursor(cursor);
}

export interface PageInput {
	limit?: number | undefined;
	after?: string | undefined;
	before?: string | undefined;
}

export function decodePageInput(input: PageInput | undefined) {
	const cursor = input?.after ?? input?.before;
	return {
		limit: Math.min(input?.limit ?? 20, 100),
		backward: !!input?.before,
		cursor,
		hasCursor: !!cursor,
	};
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
			hasNextPage: isBackward ? hasCursor : hasExtra,
			hasPreviousPage: isBackward ? hasExtra : hasCursor,
			startCursor: firstItem ? createIdCursor(firstItem.id) : null,
			endCursor: lastItem ? createIdCursor(lastItem.id) : null,
		},
	};
}

/**
 * Like buildIdCursorPage but for tables with string primary keys (e.g. better-auth users).
 */
export function buildStringIdCursorPage<T extends { id: string }>(
	rows: T[],
	limit: number,
	isBackward: boolean,
	hasCursor: boolean,
): { items: T[]; pageInfo: IdCursorPageInfo };
export function buildStringIdCursorPage<T, K extends keyof T>(
	rows: T[],
	limit: number,
	isBackward: boolean,
	hasCursor: boolean,
	key: K,
): { items: T[]; pageInfo: IdCursorPageInfo };
export function buildStringIdCursorPage(
	rows: Record<string, unknown>[],
	limit: number,
	isBackward: boolean,
	hasCursor: boolean,
	key?: string,
): { items: Record<string, unknown>[]; pageInfo: IdCursorPageInfo } {
	const hasExtra = rows.length > limit;
	let items = hasExtra ? rows.slice(0, limit) : rows;
	if (isBackward) items = items.slice().reverse();

	const firstItem = items[0];
	const lastItem = items[items.length - 1];
	const cursorKey = key ?? "id";

	return {
		items,
		pageInfo: {
			hasNextPage: isBackward ? hasCursor : hasExtra,
			hasPreviousPage: isBackward ? hasExtra : hasCursor,
			startCursor: firstItem ? createStringIdCursor(String(firstItem[cursorKey])) : null,
			endCursor: lastItem ? createStringIdCursor(String(lastItem[cursorKey])) : null,
		},
	};
}
