import { auth } from "@bimbelbeta/auth";
import type { Context as HonoContext } from "hono";

type AuthSession = typeof auth.$Infer.Session;

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return {
		session,
	};
}

export type Context = {
	session: AuthSession | null;
};
