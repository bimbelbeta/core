export {
	BYPASS_ROLES,
	canAccessContent,
	isFirstContent,
	isFirstSubject,
} from "@bimbelbeta/contract/common/content-access";

export function isSubjectPremium(_subtestOrder: number, _userRole?: string, _userIsPremium?: boolean): boolean {
	return false;
}
