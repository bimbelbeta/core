export const BYPASS_ROLES = ["admin", "superadmin"] as const;

export function canAccessContent(
	userIsPremium: boolean,
	userRole: string | undefined,
	subjectOrder: number,
	contentOrder: number,
): boolean {
	if (userRole && (BYPASS_ROLES as readonly string[]).includes(userRole)) return true;
	if (userIsPremium) return true;
	return isFirstSubject(subjectOrder) && isFirstContent(contentOrder);
}

export function isFirstSubject(subjectOrder: number): boolean {
	return subjectOrder === 1;
}

export function isFirstContent(contentOrder: number): boolean {
	return contentOrder === 1;
}
