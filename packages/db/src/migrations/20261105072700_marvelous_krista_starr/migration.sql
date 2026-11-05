CREATE TABLE "referral_code" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"status" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"max_usages" integer,
	"valid_until" timestamp,
	"premium_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "referral_usage" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"referral_code_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_usage_user_code_idx" UNIQUE("user_id","referral_code_id")
);
--> statement-breakpoint
CREATE INDEX "idx_referral_code_code" ON "referral_code" ("code");--> statement-breakpoint
CREATE INDEX "idx_referral_usage_user_id" ON "referral_usage" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_usage_code_id" ON "referral_usage" ("referral_code_id");--> statement-breakpoint
ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "referral_usage" ADD CONSTRAINT "referral_usage_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "referral_usage" ADD CONSTRAINT "referral_usage_referral_code_id_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_code"("id") ON DELETE CASCADE;