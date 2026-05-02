export function parseNullableInt(val: string | null): number | null {
	return val ? Number(val) : null;
}

/** Object.fromEntries loses generic type info — cast is unavoidable (TS#20557) */
export function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
	return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function escapeLikePattern(value: string): string {
	return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}
