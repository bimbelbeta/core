import type { auth } from "@bimbelbeta/auth";
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getApiUrl } from "@/lib/orpc";

export const authClient = createAuthClient({
	baseURL: getApiUrl(),
	fetchOptions: {
		credentials: "include",
	},
	plugins: [inferAdditionalFields<typeof auth>(), usernameClient()],
});

export type Session = typeof authClient.$Infer.Session;
