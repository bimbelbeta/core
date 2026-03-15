export function parseNullableInt(val: string | null): number | null {
	return val ? Number(val) : null;
}
