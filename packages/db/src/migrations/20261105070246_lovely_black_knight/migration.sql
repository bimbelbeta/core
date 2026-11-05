CREATE TYPE "payment_failure_code" AS ENUM('insufficient_balance', 'limit_exceeded', 'card_declined', 'fraud_rejected', 'payment_expired', 'payment_cancelled', 'provider_error', 'unknown');--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "failure_code" "payment_failure_code";--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "failure_detail" text;