export function parseNullableInt(val: string | null): number | null {
	return val ? Number(val) : null;
}

/**
 * Filters out entries with `undefined` values from an object.
 *
 * **Important**: `Object.fromEntries` silently drops keys whose value is `undefined`,
 * so the returned object may be missing keys entirely — unlike `Partial<T>` which
 * merely marks keys as optional. Callers should not rely on keys existing.
 */
export function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
	return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function escapeLikePattern(value: string): string {
	return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}
