import type { auth } from "@bimbelbeta/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getApiUrl } from "@/utils/orpc";

export const authClient = createAuthClient({
	baseURL: getApiUrl(),
	fetchOptions: {
		credentials: "include",
	},
	plugins: [inferAdditionalFields<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
