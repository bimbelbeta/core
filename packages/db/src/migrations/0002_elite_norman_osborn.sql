CREATE TYPE "public"."product_variant_enum" AS ENUM('fixed_date', 'monthly', 'credits');--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "variant" "product_variant_enum" DEFAULT 'credits' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "fixed_expiry_month" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "fixed_expiry_day" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "duration_days" integer;--> statement-breakpoint
ALTER TABLE "tryout_subtest" ADD COLUMN "scoring_map" jsonb;
