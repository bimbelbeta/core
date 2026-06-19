import type { PurchaseBenefits, TransactionWithProduct } from "@/lib/transactions/types";

export function calculateFixedDateExpiry(purchaseDate: Date, month: number, day: number): Date {
	const currentYear = purchaseDate.getFullYear();
	const thisYearExpiry = new Date(currentYear, month - 1, day);

	if (purchaseDate > thisYearExpiry) {
		return new Date(currentYear + 1, month - 1, day);
	}

	return thisYearExpiry;
}

export function calculateMonthlyExpiry(purchaseDate: Date, durationDays: number): Date {
	const expiry = new Date(purchaseDate);
	expiry.setDate(expiry.getDate() + durationDays);
	return expiry;
}

export function calculatePurchaseBenefits(
	existingTransaction: TransactionWithProduct,
	purchaseDate: Date,
): PurchaseBenefits {
	const variant = existingTransaction.prodVariant;
	let premiumExpiry: Date | null = null;

	if (variant === "fixed_date") {
		const month = existingTransaction.prodFixedExpiryMonth;
		const day = existingTransaction.prodFixedExpiryDay;
		if (month !== null && day !== null) {
			premiumExpiry = calculateFixedDateExpiry(purchaseDate, month, day);
		}
	} else if (variant === "monthly") {
		const days = existingTransaction.prodDurationDays;
		if (days !== null) {
			premiumExpiry = calculateMonthlyExpiry(purchaseDate, days);
		}
	}

	const grantsPremium = variant === "fixed_date" || variant === "monthly";
	const grantsCredits = existingTransaction.prodCredits && existingTransaction.prodCredits > 0;
	const creditsToAdd = grantsCredits ? existingTransaction.prodCredits : null;

	return {
		grantsPremium,
		grantsCredits: !!grantsCredits,
		premiumExpiry,
		creditsToAdd,
	};
}
