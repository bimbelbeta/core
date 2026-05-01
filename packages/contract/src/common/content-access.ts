export const BYPASS_ROLES = ["admin", "superadmin"] as const;
type BypassRole = (typeof BYPASS_ROLES)[number];

export function canAccessContent(
	userIsPremium: boolean,
	userRole: string | undefined,
	subjectOrder: number,
	contentOrder: number,
): boolean {
	if (BYPASS_ROLES.includes(userRole as BypassRole)) return true;
	if (userIsPremium) return true;
	return isFirstSubject(subjectOrder) && isFirstContent(contentOrder);
}

export function isFirstSubject(subjectOrder: number): boolean {
	return subjectOrder === 1;
}

export function isFirstContent(contentOrder: number): boolean {
	return contentOrder === 1;
}
