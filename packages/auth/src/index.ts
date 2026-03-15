import { db } from "@bimbelbeta/db";
import * as schema from "@bimbelbeta/db/schema/auth";
import { type } from "arktype";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { generateResetPasswordEmail } from "./lib/templates/reset-password";

const ROLE_VALUES = ["user", "admin", "superadmin"] as const;

let _resend: Resend | null = null;

function getResend(): Resend {
	if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
	return _resend;
}

export const resend: Resend = new Proxy({} as Resend, {
	get(_target, prop) {
		return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
	},
});

function createAuth() {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		user: {
			additionalFields: {
				role: {
					type: "string",
					validator: {
						input: type(`"${ROLE_VALUES[0]}" | "${ROLE_VALUES[1]}" | "${ROLE_VALUES[2]}"`),
					},
					defaultValue: ROLE_VALUES[0],
					input: false,
				},
				isPremium: {
					type: "boolean",
					validator: {
						input: type("boolean"),
					},
					defaultValue: false,
					input: false,
				},
				premiumExpiresAt: {
					type: "date",
					validator: {
						input: type("Date"),
					},
					required: false,
					defaultValue: null,
					input: false,
				},
				tryoutCredits: {
					type: "number",
					validator: {
						input: type("number"),
					},
					defaultValue: 0,
					input: false,
				},
				targetUniversityId: {
					type: "number",
					required: false,
					defaultValue: null,
					input: false,
				},
				targetStudyProgramId: {
					type: "number",
					required: false,
					defaultValue: null,
					input: false,
				},
			},
		},
		trustedOrigins: [
			process.env.CORS_ORIGIN || "http://localhost:3000",
			...(process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()) : []),
		],
		emailAndPassword: {
			enabled: true,
			sendResetPassword: async ({ user, url, token }) => {
				await getResend().emails.send({
					from: "bimbelbeta <noreply@bimbelbeta.com>",
					to: user.email,
					subject: "Pesan Otomatis: Permintaan Pengaturan Ulang Kata Sandi",
					html: generateResetPasswordEmail(user.name, url, token),
				});
			},
		},
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID ?? "",
				clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
				accessType: "offline",
				prompt: "select_account consent",
			},
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60,
			},
		},
		secret: process.env.BETTER_AUTH_SECRET,
		baseURL: process.env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "Lax",
				secure: process.env.NODE_ENV === "production",
				httpOnly: true,
			},
			...(process.env.NODE_ENV === "production" && {
				crossSubDomainCookies: {
					enabled: true,
					domain: ".bimbelbeta.com",
				},
			}),
		},
	});
}

let _auth: ReturnType<typeof createAuth> | null = null;

export const auth: ReturnType<typeof createAuth> = new Proxy({} as ReturnType<typeof createAuth>, {
	get(_target, prop) {
		if (!_auth) _auth = createAuth();
		return (_auth as unknown as Record<string | symbol, unknown>)[prop];
	},
});
