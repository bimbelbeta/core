import { CalendarIcon, ClockIcon, CreditCardIcon } from "@phosphor-icons/react";

export function isProductVariant(v: string): v is keyof typeof variantConfig {
	return v === "fixed_date" || v === "monthly" || v === "credits";
}

export const variantConfig = {
	fixed_date: {
		label: "Fixed Date",
		icon: CalendarIcon,
		iconColor: "text-purple-500",
		bgColor: "bg-purple-100",
	},
	monthly: {
		label: "Monthly",
		icon: ClockIcon,
		iconColor: "text-blue-500",
		bgColor: "bg-blue-100",
	},
	credits: {
		label: "Credits",
		icon: CreditCardIcon,
		iconColor: "text-green-500",
		bgColor: "bg-green-100",
	},
} as const;

export const months = [
	{ value: 1, label: "Januari" },
	{ value: 2, label: "Februari" },
	{ value: 3, label: "Maret" },
	{ value: 4, label: "April" },
	{ value: 5, label: "Mei" },
	{ value: 6, label: "Juni" },
	{ value: 7, label: "Juli" },
	{ value: 8, label: "Agustus" },
	{ value: 9, label: "September" },
	{ value: 10, label: "Oktober" },
	{ value: 11, label: "November" },
	{ value: 12, label: "Desember" },
] as const;
