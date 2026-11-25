export const BYPASS_ROLES = ["admin", "superadmin"] as const;

export function canAccessContent(
	_userIsPremium: boolean,
	_userRole: string | undefined,
	_subjectOrder: number,
	_contentOrder: number,
): boolean {
	return true;
}

export function isFirstSubject(subjectOrder: number): boolean {
	return subjectOrder === 1;
}

export function isFirstContent(contentOrder: number): boolean {
	return contentOrder === 1;
}
