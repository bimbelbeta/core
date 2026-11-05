import { ROLES } from "@/lib/roles";

type GuardErrors = {
	UNAUTHORIZED: () => Error;
};

type Role = string | null | undefined;

export function assertAdmin(role: Role, errors: GuardErrors): void {
	if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) throw errors.UNAUTHORIZED();
}

export function assertSuperAdmin(role: Role, errors: GuardErrors): void {
	if (role !== ROLES.SUPER_ADMIN) throw errors.UNAUTHORIZED();
}

export function isPremiumExpired(
	user: { isPremium?: boolean | null; premiumExpiresAt?: Date | null },
	now: number,
): boolean {
	return !!(user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt.getTime() < now);
}
