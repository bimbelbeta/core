/**
 * Billing / payments feature flags.
 *
 * NOTE: Client-side only. Server is the source of truth.
 */

// Toggle this (or set `VITE_PAYMENTS_ENABLED=true`) when payments are ready.
// TEMPORARILY DISABLED: Payment gateway not yet configured
export const PAYMENTS_ENABLED = false;

export const PAYMENTS_COMING_SOON_LABEL = "Segera Hadir";
