import { ORPCError } from "@orpc/server";
import { o } from "../lib/orpc";

export const requireAdmin = o.middleware(async ({ context, next }) => {
	const role = context.session?.user.role;
	if (role !== "admin" && role !== "superadmin") throw new ORPCError("UNAUTHORIZED");

	return next();
});

export const requireSuperAdmin = o.middleware(async ({ context, next }) => {
	if (context.session?.user.role !== "superadmin") throw new ORPCError("UNAUTHORIZED");

	return next();
});
