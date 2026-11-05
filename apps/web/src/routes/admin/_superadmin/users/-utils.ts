import { ROLES, type Role } from "@bimbelbeta/contract/common/roles";
import { ShieldCheckIcon, ShieldPlusIcon, UserIcon } from "@phosphor-icons/react";

export const isValidRole = (value: string | null): value is Role => Object.values(ROLES).some((role) => role === value);

export function formatPremiumExpiry(date: Date) {
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return "Kedaluwarsa";
	if (diffDays === 0) return "Hari ini";
	if (diffDays === 1) return "Besok";
	if (diffDays < 7) return `${diffDays} hari lagi`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lagi`;
	const months = Math.floor(diffDays / 30);
	if (months < 12) return `${months} bulan lagi`;
	return `${Math.max(1, Math.floor(diffDays / 365))} tahun lagi`;
}

export const roleConfig = {
	superadmin: {
		label: "Superadmin",
		icon: ShieldPlusIcon,
		className: "border-tertiary-300 bg-tertiary-100 text-tertiary-800",
	},
	admin: {
		label: "Admin",
		icon: ShieldCheckIcon,
		className: "border-primary-300 bg-primary-100 text-primary-800",
	},
	user: {
		label: "User",
		icon: UserIcon,
		className: "border-neutral-300 bg-neutral-200 text-neutral-800",
	},
} as const;

export function buildUsersSearch({
	search,
	role,
	isPremium,
	limit,
}: {
	search?: string;
	role?: Role;
	isPremium?: boolean;
	limit: number;
}) {
	return {
		...(search && { search }),
		...(role && { role }),
		...(isPremium !== undefined && { isPremium }),
		limit,
	};
}
