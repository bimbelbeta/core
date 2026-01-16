ALTER TABLE "practice_pack" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "practice_pack" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "content_json" jsonb;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "discussion_json" jsonb;