export function requireCreated<T>(
	result: T[] | undefined,
	entityName: string,
	errors: { INTERNAL_SERVER_ERROR: (opts: { message: string }) => Error },
): T {
	if (!result || result.length === 0) throw errors.INTERNAL_SERVER_ERROR({ message: `Gagal membuat ${entityName}` });
	return result[0]!;
}

export function requireFound<T>(
	result: T[] | undefined,
	entityName: string,
	errors: { NOT_FOUND: (opts: { message: string }) => Error },
): T {
	if (!result || result.length === 0) throw errors.NOT_FOUND({ message: `${entityName} tidak ditemukan` });
	return result[0]!;
}
