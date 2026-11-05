function isPrefixOf<T>(prefix: readonly T[], values: readonly T[]): boolean {
	if (prefix.length === 0) return false;
	return prefix.every((value, index) => values[index] === value);
}

export function shouldClearSelection<T>(previous: readonly T[], next: readonly T[]): boolean {
	return previous.length > 0 && !isPrefixOf(previous, next);
}

export function resolveBulkSelection<T>(shown: T[], selected: T[], incoming: T[]) {
	return {
		shown: incoming,
		selected: shouldClearSelection(shown, incoming) ? [] : selected,
	};
}
