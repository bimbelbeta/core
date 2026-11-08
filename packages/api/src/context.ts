import { auth } from "@bimbelbeta/auth";
import { ROLES, type Role, RoleSchema } from "@bimbelbeta/contract/common/roles";
import { type } from "arktype";
import type { Context as HonoContext } from "hono";

type AuthSession = typeof auth.$Infer.Session;

export type Session = Omit<AuthSession, "user"> & {
	user: Omit<AuthSession["user"], "role"> & { role: Role };
};

export type CreateContextOptions = {
	context: HonoContext;
};

function narrowSession(raw: AuthSession): Session {
	const role = RoleSchema(raw.user.role);
	return {
		...raw,
		user: {
			...raw.user,
			role: role instanceof type.errors ? ROLES.USER : role,
		},
	};
}

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return {
		session: session ? narrowSession(session) : null,
	};
}

export type Context = {
	session: Session | null;
};
