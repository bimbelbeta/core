import { DomainError } from "@/lib/domain-error";

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

export function createDateIdCursor(date: Date | null, id: number): string {
	return encodeCursor(`${date ? date.getTime() : ""}:${id}`);
}

export function parseDateIdCursor(cursor: string): { date: Date | null; id: number } {
	const decoded = decodeCursor(cursor);
	const match = /^(-?\d*):(-?\d+)$/.exec(decoded);
	if (!match) {
		throw new DomainError("BAD_REQUEST", "Kursor tidak valid");
	}
	return { date: match[1] ? new Date(Number(match[1])) : null, id: Number.parseInt(match[2]!, 10) };
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

export function decodePageInput(input: PageInput | undefined, defaultLimit = 20) {
	const cursor = input?.after ?? input?.before;
	return {
		limit: Math.min(input?.limit ?? defaultLimit, 100),
		backward: !!input?.before,
		cursor,
		hasCursor: !!cursor,
	};
}

export function decodeIdPage(input: PageInput | undefined, defaultLimit = 20) {
	const { limit, backward, cursor, hasCursor } = decodePageInput(input, defaultLimit);
	return { limit, backward, cursorId: cursor ? parseIdCursor(cursor) : undefined, hasCursor };
}

export function decodeStringIdPage(input: PageInput | undefined, defaultLimit = 20) {
	const { limit, backward, cursor, hasCursor } = decodePageInput(input, defaultLimit);
	return { limit, backward, cursorId: cursor ? parseStringIdCursor(cursor) : undefined, hasCursor };
}

export function decodeDateIdPage(input: PageInput | undefined, defaultLimit = 20) {
	const { limit, backward, cursor, hasCursor } = decodePageInput(input, defaultLimit);
	return { limit, backward, cursorDateId: cursor ? parseDateIdCursor(cursor) : undefined, hasCursor };
}
export interface IdCursorPageInfo {
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	startCursor: string | null;
	endCursor: string | null;
}

/**
 * Applies the standard cursor pagination post-processing: slices the extra
 * sentinel item, reverses backward results, and builds the pageInfo object.
 * Callers must fetch `limit + 1` rows to enable hasExtra detection.
 */
function buildCursorPage<T>(
	rows: T[],
	limit: number,
	isBackward: boolean,
	hasCursor: boolean,
	cursorOf: (row: T) => string,
): { items: T[]; pageInfo: IdCursorPageInfo } {
	const hasExtra = rows.length > limit;
	const items = hasExtra ? rows.slice(0, limit) : rows;
	const ordered = isBackward ? items.slice().reverse() : items;

	const firstItem = ordered[0];
	const lastItem = ordered[ordered.length - 1];

	return {
		items: ordered,
		pageInfo: {
			hasNextPage: isBackward ? hasCursor : hasExtra,
			hasPreviousPage: isBackward ? hasExtra : hasCursor,
			startCursor: firstItem ? cursorOf(firstItem) : null,
			endCursor: lastItem ? cursorOf(lastItem) : null,
		},
	};
}

export function buildIdCursorPage<T extends { id: number }>(
	rows: T[],
	limit: number,
	isBackward: boolean,
	hasCursor: boolean,
): { items: T[]; pageInfo: IdCursorPageInfo } {
	return buildCursorPage(rows, limit, isBackward, hasCursor, (row) => createIdCursor(row.id));
}

export function buildDateIdCursorPage<T extends { startsAt: Date | null; id: number }>(
	rows: T[],
	limit: number,
	isBackward: boolean,
	hasCursor: boolean,
): { items: T[]; pageInfo: IdCursorPageInfo } {
	return buildCursorPage(rows, limit, isBackward, hasCursor, (row) => createDateIdCursor(row.startsAt, row.id));
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
	const cursorKey = key ?? "id";
	return buildCursorPage(rows, limit, isBackward, hasCursor, (row) => createStringIdCursor(String(row[cursorKey])));
}
