import { ShieldCheck, ShieldPlus, User as UserIcon } from "lucide-react";

export function getInitials(name: string) {
	return name
		.split(" ")
		.slice(0, 2)
		.map((n) => n[0])
		.join("")
		.toUpperCase();
}

export function formatRelativeDate(date: Date) {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Hari ini";
	if (diffDays === 1) return "Kemarin";
	if (diffDays < 7) return `${diffDays} hari lalu`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
	return `${Math.floor(diffDays / 365)} tahun lalu`;
}

export function formatPremiumExpiry(date: Date) {
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return "Kedaluwarsa";
	if (diffDays === 0) return "Hari ini";
	if (diffDays === 1) return "Besok";
	if (diffDays < 7) return `${diffDays} hari lagi`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lagi`;
	return `${Math.floor(diffDays / 30)} bulan lagi`;
}

export const roleConfig = {
	superadmin: {
		label: "Superadmin",
		icon: ShieldPlus,
		className: "border-tertiary-300 bg-tertiary-100 text-tertiary-800",
	},
	admin: {
		label: "Admin",
		icon: ShieldCheck,
		className: "border-primary-300 bg-primary-100 text-primary-800",
	},
	user: {
		label: "User",
		icon: UserIcon,
		className: "border-neutral-300 bg-neutral-200 text-neutral-800",
	},
} as const;
