ALTER TABLE "app"."tryout_attempt" DROP CONSTRAINT "user_tryout_attempt";--> statement-breakpoint
ALTER TABLE "app"."tryout_attempt" ADD COLUMN "attempt_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."tryout_attempt" ADD COLUMN "break_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "app"."tryout_attempt" ADD CONSTRAINT "user_tryout_attempt_number" UNIQUE("user_id","tryout_id","attempt_number");