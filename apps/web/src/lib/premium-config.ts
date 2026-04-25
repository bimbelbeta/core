/**
 * Premium content access configuration
 * Client-side helpers that mirror server-side logic
 *
 * IMPORTANT: These are for UI display only. Server-side validation is the source of truth.
 */

export { canAccessContent, isFirstContent, isFirstSubject } from "@bimbelbeta/contract/common/content-access";

const BYPASS_ROLES = ["admin", "superadmin"] as const;

/**
 * Check if a subject requires premium access (for UI display)
 * Only the first subject (order=1) is accessible to free users
 *
 * @param subtestOrder - The order of the subject
 * @param userRole - The user's role
 * @param userIsPremium - Whether the user has premium access
 */
export function isSubjectPremium(subtestOrder: number, userRole?: string, userIsPremium?: boolean): boolean {
	// Admin/superadmin and premium users see no lock
	if (BYPASS_ROLES.includes(userRole as (typeof BYPASS_ROLES)[number]) || userIsPremium) return false;
	return subtestOrder !== 1;
}
