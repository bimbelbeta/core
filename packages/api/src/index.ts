import { o } from "./lib/router-definition";
import {
	rateLimit,
	requireAdmin,
	requireAuth,
	requirePremium,
	requireSuperAdmin,
} from "./lib/router-definition/middleware";

const pubImplementer = o;
const authedImplementer = pubImplementer.use(requireAuth).use(rateLimit);
const premiumImplementer: typeof authedImplementer = authedImplementer.use(requirePremium);
const adminImplementer: typeof authedImplementer = authedImplementer.use(requireAdmin);
const superadminImplementer: typeof authedImplementer = authedImplementer.use(requireSuperAdmin);

type PublicImplementer = typeof pubImplementer;
type AuthedImplementer = typeof authedImplementer;
type PremiumImplementer = typeof premiumImplementer;
type AdminImplementer = typeof adminImplementer;
type SuperadminImplementer = typeof superadminImplementer;

export const pub: PublicImplementer = pubImplementer;
export const authed: AuthedImplementer = authedImplementer;
export const premium: PremiumImplementer = premiumImplementer;
export const admin: AdminImplementer = adminImplementer;
export const superadmin: SuperadminImplementer = superadminImplementer;
