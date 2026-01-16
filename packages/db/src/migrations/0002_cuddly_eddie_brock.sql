ALTER TYPE "public"."transaction_type_enum" RENAME TO "product_type_enum";--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"price" numeric NOT NULL,
	"type" "product_type_enum" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."product_type_enum";--> statement-breakpoint
CREATE TYPE "public"."product_type_enum" AS ENUM('subscription', 'product');--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "type" SET DATA TYPE "public"."product_type_enum" USING "type"::"public"."product_type_enum";--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "transaction_type";