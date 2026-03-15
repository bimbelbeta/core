import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { eq } from "drizzle-orm";
import { ROLES } from "../roles";
import { baseImplementer } from ".";
import { getFreeRatelimiter, getPremiumRatelimiter } from "./rate-limiter";

export const rateLimit = createRatelimitMiddleware({
	limiter: ({ context }) => (context.session.user.isPremium ? getPremiumRatelimiter() : getFreeRatelimiter()),
	key: ({ context }) => context.session.user.id,
});

export const requireAdmin = baseImplementer.middleware(async ({ context, next, errors }) => {
	const role = context.session?.user.role;
	if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) throw errors.UNAUTHORIZED();

	return next();
});

export const requireSuperAdmin = baseImplementer.middleware(async ({ context, next, errors }) => {
	if (context.session?.user.role !== ROLES.SUPER_ADMIN) throw errors.UNAUTHORIZED();

	return next();
});

export const requireAuth = baseImplementer.middleware(async ({ context, next, errors }) => {
	if (!context.session?.user) throw errors.UNAUTHORIZED();

	return next({
		context: {
			session: context.session,
		},
	});
});

export const revokeExpiredPremium = baseImplementer.middleware(async ({ context, next }) => {
	const sess = context.session;
	if (sess?.user.isPremium && sess.user.premiumExpiresAt && sess.user.premiumExpiresAt.getTime() < Date.now()) {
		await db
			.update(user)
			.set({ isPremium: false })
			.where(eq(user.id, sess.user.id))
			.then(() => {
				sess.user.isPremium = false;
			});
	}

	return next();
});

export const requirePremium = baseImplementer.middleware(async ({ context, next, errors }) => {
	if (
		!context.session?.user.isPremium &&
		context.session?.user.role !== ROLES.ADMIN &&
		context.session?.user.role !== ROLES.SUPER_ADMIN
	)
		throw errors.FORBIDDEN();

	return next({
		context: {
			session: context.session,
		},
	});
});
