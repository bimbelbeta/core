export function isPrefixOf<T>(prefix: readonly T[], values: readonly T[]): boolean {
	if (prefix.length === 0) return false;
	return prefix.every((value, index) => values[index] === value);
}

export function shouldClearSelection<T>(previous: readonly T[], next: readonly T[]): boolean {
	if (previous.length === 0) return false;
	if (isPrefixOf(previous, next)) return false;
	return previous.join(",") !== next.join(",");
}
