import { contract } from "@bimbelbeta/contract";
import { implement } from "@orpc/server";
import type { Context } from "@/context";
import { rateLimit, requireAdmin, requireAuth, requireSuperAdmin, revokeExpiredPremium } from "@/lib/router-definition/middleware";

export const baseImplementer = implement(contract).$context<Context>();

/**
 * Convenience factory for authenticated routes that require auth + premium check + rate limiting.
 * Use this instead of repeating `.use(requireAuth).use(revokeExpiredPremium).use(rateLimit)` in every router.
 */
export const authedImplementer = baseImplementer.use(requireAuth).use(revokeExpiredPremium).use(rateLimit);

/**
 * Convenience factory for authenticated routes that require auth + rate limiting (no premium check).
 * Use this for admin routes that add their own role middleware.
 */
export const authedNoPremiumImplementer = baseImplementer.use(requireAuth).use(rateLimit);

/**
 * Convenience factory for admin routes: auth + rate limit + admin role check.
 */
export const adminImplementer = baseImplementer.use(requireAuth).use(rateLimit).use(requireAdmin);

/**
 * Convenience factory for superadmin routes: auth + rate limit + superadmin role check.
 */
export const superAdminImplementer = baseImplementer.use(requireAuth).use(rateLimit).use(requireSuperAdmin);

