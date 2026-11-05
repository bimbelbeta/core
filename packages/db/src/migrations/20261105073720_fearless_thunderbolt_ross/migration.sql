CREATE SCHEMA "app";
--> statement-breakpoint
ALTER TYPE "question_type" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "subject_category" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "payment_failure_code" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "product_variant_enum" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "transaction_status_enum" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "product_type_enum" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "tryout_attempt_status" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "tryout_category" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "tryout_status" SET SCHEMA "app";--> statement-breakpoint
ALTER TYPE "study_program_category" SET SCHEMA "app";--> statement-breakpoint
ALTER TABLE "account" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "session" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "user" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "verification" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "credit_transaction" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "question" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "question_choice" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "referral_code" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "referral_usage" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "content_item" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "content_practice_questions" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "note_material" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "recent_content_view" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "subject" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "user_progress" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "user_subject_view" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "video_material" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "product" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "transaction" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "tryout" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "tryout_access_code" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "tryout_attempt" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "tryout_subtest" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "tryout_subtest_attempt" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "tryout_subtest_question" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "tryout_user_answer" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "program_yearly_data" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "study_program" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "university" SET SCHEMA "app";
--> statement-breakpoint
ALTER TABLE "university_study_program" SET SCHEMA "app";
