import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { eq } from "drizzle-orm";
import { ROLES } from "@/lib/roles";
import { bareImplementer } from "@/lib/router-definition/base";
import { assertAdmin, assertSuperAdmin, isPremiumExpired } from "@/lib/router-definition/guards";
import { getFreeRatelimiter, getNoOpRatelimiter, getPremiumRatelimiter } from "@/lib/router-definition/rate-limiter";

export const rateLimit = createRatelimitMiddleware({
	limiter: ({ context }) => {
		const role = context.session.user.role;
		if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) return getNoOpRatelimiter();
		return context.session.user.isPremium ? getPremiumRatelimiter() : getFreeRatelimiter();
	},
	key: ({ context }) => context.session.user.id,
});

export const requireAdmin = bareImplementer.middleware(async ({ context, next, errors }) => {
	assertAdmin(context.session?.user.role, errors);

	return next();
});

export const requireSuperAdmin = bareImplementer.middleware(async ({ context, next, errors }) => {
	assertSuperAdmin(context.session?.user.role, errors);

	return next();
});

export const requireAuth = bareImplementer.middleware(async ({ context, next, errors }) => {
	const session = context.session;
	if (!session?.user) throw errors.UNAUTHORIZED();

	return next({
		context: {
			session,
		},
	});
});

export const revokeExpiredPremium = bareImplementer.middleware(async ({ context, next }) => {
	const sess = context.session;
	if (sess && isPremiumExpired(sess.user, Date.now())) {
		await db.update(user).set({ isPremium: false }).where(eq(user.id, sess.user.id));

		return next({
			context: {
				session: {
					...sess,
					user: { ...sess.user, isPremium: false },
				},
			},
		});
	}

	return next();
});
