/**
 * Billing / payments feature flags.
 *
 * NOTE: Client-side only. Server is the source of truth.
 */

export const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === "true";

export const PAYMENTS_COMING_SOON_LABEL = "Segera Hadir";
