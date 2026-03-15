export const ROLES = {
	USER: "user",
	ADMIN: "admin",
	SUPER_ADMIN: "superadmin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
