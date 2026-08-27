import { RoleSchema } from "@bimbelbeta/contract/common/roles";
import { db } from "@bimbelbeta/db";
import * as schema from "@bimbelbeta/db/schema/auth";
import { type } from "arktype";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { Resend } from "resend";
import { generateResetPasswordEmail } from "@/lib/templates/reset-password";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	user: {
		additionalFields: {
			role: {
				type: "string",
				validator: {
					input: RoleSchema,
				},
				defaultValue: "user",
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
			await resend.emails.send({
				from: "bimbelbeta <noreply@bimbelbeta.com>",
				to: user.email,
				subject: "Pesan Otomatis: Permintaan Pengaturan Ulang Kata Sandi",
				html: generateResetPasswordEmail(user.name, url, token),
			});
		},
	},
	plugins: [
		username({
			schema: {
				user: {
					fields: {
						username: "name",
						displayUsername: "name",
					},
				},
			},
			usernameValidator: (value) => /^[a-zA-Z0-9 ]+$/.test(value.trim()),
		}),
	],
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
			enabled: false,
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
