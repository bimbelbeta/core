import type { contract } from "@bimbelbeta/contract";
import type { ImplementerInternalWithMiddlewares } from "@orpc/server";
import type { Context } from "./context";
import { baseImplementer } from "./lib/router-definition";
import {
	rateLimit,
	requireAdmin,
	requireAuth,
	requirePremium,
	requireSuperAdmin,
	revokeExpiredPremium,
} from "./lib/router-definition/middleware";

type Contract = typeof contract;
type AuthContext = { session: NonNullable<Context["session"]> };

export const pub = baseImplementer;
export const authed: ImplementerInternalWithMiddlewares<Contract, Context, AuthContext> = pub
	.use(requireAuth)
	.use(rateLimit) as unknown as ImplementerInternalWithMiddlewares<Contract, Context, AuthContext>;
export const premium: ImplementerInternalWithMiddlewares<Contract, Context, AuthContext> = authed
	.use(revokeExpiredPremium)
	.use(requirePremium) as unknown as ImplementerInternalWithMiddlewares<Contract, Context, AuthContext>;
export const admin: ImplementerInternalWithMiddlewares<Contract, Context, AuthContext> = authed.use(
	requireAdmin,
) as unknown as ImplementerInternalWithMiddlewares<Contract, Context, AuthContext>;
export const superadmin: ImplementerInternalWithMiddlewares<Contract, Context, AuthContext> = authed.use(
	requireSuperAdmin,
) as unknown as ImplementerInternalWithMiddlewares<Contract, Context, AuthContext>;
