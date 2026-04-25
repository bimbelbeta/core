export function parseNullableInt(val: string | null): number | null {
	return val ? Number(val) : null;
}

/**
 * Returns a new object containing only the keys from `input` whose values are not `undefined`.
 * Useful for building partial-update payloads without explicit `if (x !== undefined)` chains.
 */
export function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
	return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}
