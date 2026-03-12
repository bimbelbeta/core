import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { o } from ".";
import { freeRatelimiter, premiumRatelimiter } from "./rate-limiter";

export const rateLimit = createRatelimitMiddleware({
	limiter: ({ context }) => (context.session.user.isPremium ? premiumRatelimiter : freeRatelimiter),
	key: ({ context }) => context.session.user.id,
});

export const requireAdmin = o.middleware(async ({ context, next }) => {
	const role = context.session?.user.role;
	if (role !== "admin" && role !== "superadmin") throw new ORPCError("UNAUTHORIZED");

	return next();
});

export const requireSuperAdmin = o.middleware(async ({ context, next }) => {
	if (context.session?.user.role !== "superadmin") throw new ORPCError("UNAUTHORIZED");

	return next();
});

export const requireAuth = o.middleware(async ({ context, next, errors }) => {
	if (!context.session?.user) throw errors.UNAUTHORIZED();

	if (
		context.session.user.isPremium &&
		context.session.user.premiumExpiresAt &&
		context.session.user.premiumExpiresAt.getTime() < Date.now()
	) {
		await db
			.update(user)
			.set({ isPremium: false })
			.where(eq(user.id, context.session.user.id))
			.then(() => {
				context.session!.user.isPremium = false;
			});
	}

	return next({
		context: {
			session: context.session,
		},
	});
});

export const requirePremium = o.middleware(({ context, next, errors }) => {
	if (
		!context.session?.user.isPremium &&
		context.session?.user.role !== "admin" &&
		context.session?.user.role !== "superadmin"
	)
		throw errors.FORBIDDEN({
			message: "Akun premium dibutuhkan untuk mengakses resource ini.",
		});

	return next({
		context: {
			session: context.session,
		},
	});
});
