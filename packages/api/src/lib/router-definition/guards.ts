import { ROLES } from "@/lib/roles";

type GuardErrors = {
	UNAUTHORIZED: () => Error;
	FORBIDDEN: () => Error;
};

type Role = string | null | undefined;

export function assertAdmin(role: Role, errors: GuardErrors): void {
	if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) throw errors.UNAUTHORIZED();
}

export function assertSuperAdmin(role: Role, errors: GuardErrors): void {
	if (role !== ROLES.SUPER_ADMIN) throw errors.UNAUTHORIZED();
}

export function assertPremium(user: { isPremium?: boolean | null; role?: Role }, errors: GuardErrors): void {
	if (!user.isPremium && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) throw errors.FORBIDDEN();
}

export function isPremiumExpired(
	user: { isPremium?: boolean | null; premiumExpiresAt?: Date | null },
	now: number,
): boolean {
	return !!(user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt.getTime() < now);
}
