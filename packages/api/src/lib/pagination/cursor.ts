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
