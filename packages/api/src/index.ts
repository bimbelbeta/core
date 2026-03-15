import { baseImplementer } from "./lib/router-definition";
import {
	rateLimit,
	requireAdmin,
	requireAuth,
	requirePremium,
	requireSuperAdmin,
	revokeExpiredPremium,
} from "./lib/router-definition/middleware";

export const pub = baseImplementer;
export const authed = pub.use(requireAuth).use(rateLimit);
export const premium = authed.use(revokeExpiredPremium).use(requirePremium);
export const admin = authed.use(requireAdmin);
export const superadmin = authed.use(requireSuperAdmin);
