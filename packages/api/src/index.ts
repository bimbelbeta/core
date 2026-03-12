import { o } from "./lib/router-definition";
import {
	rateLimit,
	requireAdmin,
	requireAuth,
	requirePremium,
	requireSuperAdmin,
} from "./lib/router-definition/middleware";

export const pub = o;
export const authed = pub.use(requireAuth).use(rateLimit);
export const premium = authed.use(requirePremium);
export const admin = authed.use(requireAdmin);
export const superadmin = authed.use(requireSuperAdmin);
