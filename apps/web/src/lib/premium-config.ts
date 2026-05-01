import { BYPASS_ROLES } from "@bimbelbeta/contract/common/content-access";

export {
	BYPASS_ROLES,
	canAccessContent,
	isFirstContent,
	isFirstSubject,
} from "@bimbelbeta/contract/common/content-access";

export function isSubjectPremium(subtestOrder: number, userRole?: string, userIsPremium?: boolean): boolean {
	if (BYPASS_ROLES.includes(userRole as (typeof BYPASS_ROLES)[number]) || userIsPremium) return false;
	return subtestOrder !== 1;
}
