import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { eq } from "drizzle-orm";
import { o } from "./lib/orpc";
import { rateLimit } from "./middlewares/rate-limit";
import { requireAdmin, requireSuperAdmin } from "./middlewares/rbac";

export const pub = o;
const requireAuth = o.middleware(async ({ context, next, errors }) => {
	if (!context.session?.user) throw errors.UNAUTHORIZED();

	// Reset premium status if expired
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

const requirePremium = o.middleware(({ context, next, errors }) => {
	if (!context.session?.user.isPremium)
		throw errors.FORBIDDEN({
			message: "Akun premium dibutuhkan untuk mengakses resource ini.",
		});

	return next({
		context: {
			session: context.session,
		},
	});
});

export const authed = pub.use(requireAuth);
export const premium = authed.use(requirePremium);
export const admin = authed.use(requireAdmin);
export const superadmin = authed.use(requireSuperAdmin);
export const authedRateLimited = authed.use(rateLimit);
