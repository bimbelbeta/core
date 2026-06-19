CREATE TYPE "question_type" AS ENUM('multiple_choice', 'multiple_choice_complex', 'essay');--> statement-breakpoint
CREATE TYPE "subject_category" AS ENUM('sd', 'smp', 'sma', 'utbk');--> statement-breakpoint
CREATE TYPE "product_variant_enum" AS ENUM('fixed_date', 'monthly', 'credits');--> statement-breakpoint
CREATE TYPE "transaction_status_enum" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "product_type_enum" AS ENUM('subscription', 'product');--> statement-breakpoint
CREATE TYPE "tryout_attempt_status" AS ENUM('not_started', 'ongoing', 'finished');--> statement-breakpoint
CREATE TYPE "tryout_category" AS ENUM('sd', 'smp', 'sma', 'utbk');--> statement-breakpoint
CREATE TYPE "tryout_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "study_program_category" AS ENUM('SAINTEK', 'SOSHUM');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user',
	"is_premium" boolean DEFAULT false,
	"premium_expires_at" timestamp,
	"tryout_credits" integer DEFAULT 0,
	"target_university_id" integer,
	"target_study_program_id" integer
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"transaction_id" text,
	"tryout_attempt_id" integer,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "question_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "question_type" DEFAULT 'multiple_choice'::"question_type" NOT NULL,
	"content" text NOT NULL,
	"discussion" text NOT NULL,
	"content_json" jsonb,
	"discussion_json" jsonb,
	"essay_correct_answer" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_choice" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "question_choice_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"question_id" integer NOT NULL,
	"code" char(1) NOT NULL,
	"content" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "question_choice_unique" UNIQUE("question_id","code")
);
--> statement-breakpoint
CREATE TABLE "content_item" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"subject_id" integer NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_content_order" UNIQUE("subject_id","order")
);
--> statement-breakpoint
CREATE TABLE "content_practice_questions" (
	"content_item_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "unique_practice_questions_order" UNIQUE("content_item_id","order")
);
--> statement-breakpoint
CREATE TABLE "note_material" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "note_material_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"content_item_id" integer NOT NULL UNIQUE,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recent_content_view" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recent_content_view_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"content_item_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"short_name" text NOT NULL UNIQUE,
	"description" text,
	"order" integer DEFAULT 1 NOT NULL,
	"category" "subject_category" DEFAULT 'utbk'::"subject_category" NOT NULL,
	"grade_level" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_progress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"content_item_id" integer NOT NULL,
	"video_completed" boolean DEFAULT false NOT NULL,
	"note_completed" boolean DEFAULT false NOT NULL,
	"practice_questions_completed" boolean DEFAULT false NOT NULL,
	"last_viewed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_content" UNIQUE("user_id","content_item_id")
);
--> statement-breakpoint
CREATE TABLE "user_subject_view" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_subject_view_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"subject_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_subject" UNIQUE("user_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "video_material" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "video_material_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"content_item_id" integer NOT NULL UNIQUE,
	"video_url" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"price" numeric NOT NULL,
	"type" "product_type_enum" NOT NULL,
	"variant" "product_variant_enum" DEFAULT 'credits'::"product_variant_enum" NOT NULL,
	"fixed_expiry_month" integer,
	"fixed_expiry_day" integer,
	"duration_days" integer,
	"credits" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY,
	"user_id" text,
	"product_id" uuid,
	"gross_amount" numeric,
	"status" "transaction_status_enum" DEFAULT 'pending'::"transaction_status_enum" NOT NULL,
	"paid_at" timestamp,
	"ordered_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tryout" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"passing_grade" integer DEFAULT 600 NOT NULL,
	"category" "tryout_category" DEFAULT 'utbk'::"tryout_category" NOT NULL,
	"status" "tryout_status" DEFAULT 'draft'::"tryout_status" NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tryout_access_code" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_access_code_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tryout_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"code_preview" text NOT NULL,
	"label" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_tryout_access_code_hash" UNIQUE("tryout_id","code_hash")
);
--> statement-breakpoint
CREATE TABLE "tryout_attempt" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_attempt_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"tryout_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"deadline" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" "tryout_attempt_status" DEFAULT 'ongoing'::"tryout_attempt_status" NOT NULL,
	"score" numeric(10,2),
	"submitted_image_url" text,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"used_credit" boolean DEFAULT false NOT NULL,
	"used_access_code" boolean DEFAULT false NOT NULL,
	"access_code_id" integer,
	CONSTRAINT "user_tryout_attempt" UNIQUE("user_id","tryout_id")
);
--> statement-breakpoint
CREATE TABLE "tryout_subtest" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_subtest_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tryout_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"question_order" text DEFAULT 'sequential' NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"scoring_map" jsonb,
	CONSTRAINT "tryout_subtest_order" UNIQUE("tryout_id","order")
);
--> statement-breakpoint
CREATE TABLE "tryout_subtest_attempt" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_subtest_attempt_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tryout_attempt_id" integer NOT NULL,
	"subtest_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"deadline" timestamp NOT NULL,
	"status" "tryout_attempt_status" DEFAULT 'ongoing'::"tryout_attempt_status" NOT NULL,
	"score" numeric(10,2),
	CONSTRAINT "user_tryout_subtest_attempt" UNIQUE("tryout_attempt_id","subtest_id")
);
--> statement-breakpoint
CREATE TABLE "tryout_subtest_question" (
	"subtest_id" integer,
	"question_id" integer,
	"order" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tryout_subtest_question_pkey" PRIMARY KEY("subtest_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "tryout_user_answer" (
	"attempt_id" integer,
	"question_id" integer,
	"selected_choice_id" integer,
	"selected_choice_ids" integer[],
	"essay_answer" text,
	"is_doubtful" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tryout_user_answer_pkey" PRIMARY KEY("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "program_yearly_data" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "program_yearly_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"university_study_program_id" integer NOT NULL,
	"year" integer NOT NULL,
	"average_grade" integer,
	"passing_grade" integer,
	"applicant_count" integer,
	"passed_count" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "program_yearly_data_unique" UNIQUE("university_study_program_id","year")
);
--> statement-breakpoint
CREATE TABLE "study_program" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "study_program_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "study_program_slug" UNIQUE,
	"description" text,
	"category" "study_program_category",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "university" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "university_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "university_slug" UNIQUE,
	"logo" text,
	"description" text,
	"location" text,
	"website" text,
	"rank" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "university_study_program" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "university_study_program_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"university_id" integer NOT NULL,
	"study_program_id" integer NOT NULL,
	"tuition" integer,
	"capacity" integer,
	"accreditation" text,
	"average_score" integer DEFAULT 500 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "university_study_program_unique" UNIQUE("university_id","study_program_id")
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "idx_credit_transaction_user_id" ON "credit_transaction" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recent_view_user_time" ON "recent_content_view" ("user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "idx_user_progress_user" ON "user_progress" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_content" ON "user_progress" ("content_item_id");--> statement-breakpoint
CREATE INDEX "idx_user_subject_view_user" ON "user_subject_view" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_user_id" ON "transaction" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_product_id" ON "transaction" ("product_id");--> statement-breakpoint
CREATE INDEX "idx_tryout_access_code_tryout_id" ON "tryout_access_code" ("tryout_id");--> statement-breakpoint
CREATE INDEX "idx_tryout_attempt_tryout_id" ON "tryout_attempt" ("tryout_id");--> statement-breakpoint
CREATE INDEX "idx_tryout_subtest_attempt_subtest_id" ON "tryout_subtest_attempt" ("subtest_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_tryout_attempt_id_tryout_attempt_id_fkey" FOREIGN KEY ("tryout_attempt_id") REFERENCES "tryout_attempt"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "question_choice" ADD CONSTRAINT "question_choice_question_id_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "content_item" ADD CONSTRAINT "content_item_subject_id_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "content_practice_questions" ADD CONSTRAINT "content_practice_questions_content_item_id_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "content_practice_questions" ADD CONSTRAINT "content_practice_questions_question_id_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "note_material" ADD CONSTRAINT "note_material_content_item_id_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recent_content_view" ADD CONSTRAINT "recent_content_view_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recent_content_view" ADD CONSTRAINT "recent_content_view_content_item_id_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_content_item_id_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_subject_view" ADD CONSTRAINT "user_subject_view_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_subject_view" ADD CONSTRAINT "user_subject_view_subject_id_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "video_material" ADD CONSTRAINT "video_material_content_item_id_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_product_id_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "tryout_access_code" ADD CONSTRAINT "tryout_access_code_tryout_id_tryout_id_fkey" FOREIGN KEY ("tryout_id") REFERENCES "tryout"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_attempt" ADD CONSTRAINT "tryout_attempt_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "tryout_attempt" ADD CONSTRAINT "tryout_attempt_tryout_id_tryout_id_fkey" FOREIGN KEY ("tryout_id") REFERENCES "tryout"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_attempt" ADD CONSTRAINT "tryout_attempt_access_code_id_tryout_access_code_id_fkey" FOREIGN KEY ("access_code_id") REFERENCES "tryout_access_code"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "tryout_subtest" ADD CONSTRAINT "tryout_subtest_tryout_id_tryout_id_fkey" FOREIGN KEY ("tryout_id") REFERENCES "tryout"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_subtest_attempt" ADD CONSTRAINT "tryout_subtest_attempt_tryout_attempt_id_tryout_attempt_id_fkey" FOREIGN KEY ("tryout_attempt_id") REFERENCES "tryout_attempt"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_subtest_attempt" ADD CONSTRAINT "tryout_subtest_attempt_subtest_id_tryout_subtest_id_fkey" FOREIGN KEY ("subtest_id") REFERENCES "tryout_subtest"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_subtest_question" ADD CONSTRAINT "tryout_subtest_question_subtest_id_tryout_subtest_id_fkey" FOREIGN KEY ("subtest_id") REFERENCES "tryout_subtest"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_subtest_question" ADD CONSTRAINT "tryout_subtest_question_question_id_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_user_answer" ADD CONSTRAINT "tryout_user_answer_attempt_id_tryout_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "tryout_attempt"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_user_answer" ADD CONSTRAINT "tryout_user_answer_question_id_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tryout_user_answer" ADD CONSTRAINT "tryout_user_answer_selected_choice_id_question_choice_id_fkey" FOREIGN KEY ("selected_choice_id") REFERENCES "question_choice"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "program_yearly_data" ADD CONSTRAINT "program_yearly_data_vFNn2VxW2Vfe_fkey" FOREIGN KEY ("university_study_program_id") REFERENCES "university_study_program"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "university_study_program" ADD CONSTRAINT "university_study_program_university_id_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "university_study_program" ADD CONSTRAINT "university_study_program_study_program_id_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "study_program"("id") ON DELETE CASCADE;