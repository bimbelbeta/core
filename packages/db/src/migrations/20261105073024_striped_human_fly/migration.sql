ALTER TABLE "transaction" ADD COLUMN "amount_paid" numeric;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "provider" text DEFAULT 'midtrans' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "provider_transaction_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "expires_at" timestamp;