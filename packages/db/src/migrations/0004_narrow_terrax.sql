CREATE TYPE "public"."tryout_question_type" AS ENUM('multiple_choice', 'essay');--> statement-breakpoint
CREATE TYPE "public"."tryout_status" AS ENUM('not_started', 'ongoing', 'finished');--> statement-breakpoint
CREATE TABLE "tryout" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tryout_attempt" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_attempt_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"tryout_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"status" "tryout_status" DEFAULT 'ongoing' NOT NULL,
	"score" integer,
	"submitted_image_url" text,
	"is_revoked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_tryout_attempt" UNIQUE("user_id","tryout_id")
);
--> statement-breakpoint
CREATE TABLE "tryout_question" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_question_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "tryout_question_type" DEFAULT 'multiple_choice' NOT NULL,
	"content" text NOT NULL,
	"discussion" text,
	"content_json" jsonb,
	"discussion_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "tryout_question_choice" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_question_choice_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"question_id" integer NOT NULL,
	"code" char(1) NOT NULL,
	"content" text NOT NULL,
	"content_json" jsonb,
	"is_correct" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tryout_question_choice_unique" UNIQUE("question_id","code")
);
--> statement-breakpoint
CREATE TABLE "tryout_subtest" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tryout_subtest_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tryout_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
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
	"status" "tryout_status" DEFAULT 'ongoing' NOT NULL,
	CONSTRAINT "user_tryout_subtest_attempt" UNIQUE("tryout_attempt_id","subtest_id")
);
--> statement-breakpoint
CREATE TABLE "tryout_subtest_question" (
	"subtest_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"order" integer DEFAULT 1,
	CONSTRAINT "tryout_subtest_question_subtest_id_question_id_pk" PRIMARY KEY("subtest_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "tryout_user_answer" (
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"selected_choice_id" integer,
	"essay_answer" text,
	"essay_answer_json" jsonb,
	CONSTRAINT "tryout_user_answer_attempt_id_question_id_pk" PRIMARY KEY("attempt_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "question_answer_option" ADD COLUMN "content_json" jsonb;--> statement-breakpoint
ALTER TABLE "tryout_attempt" ADD CONSTRAINT "tryout_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_attempt" ADD CONSTRAINT "tryout_attempt_tryout_id_tryout_id_fk" FOREIGN KEY ("tryout_id") REFERENCES "public"."tryout"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_question_choice" ADD CONSTRAINT "tryout_question_choice_question_id_tryout_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."tryout_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_subtest" ADD CONSTRAINT "tryout_subtest_tryout_id_tryout_id_fk" FOREIGN KEY ("tryout_id") REFERENCES "public"."tryout"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_subtest_attempt" ADD CONSTRAINT "tryout_subtest_attempt_tryout_attempt_id_tryout_attempt_id_fk" FOREIGN KEY ("tryout_attempt_id") REFERENCES "public"."tryout_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_subtest_attempt" ADD CONSTRAINT "tryout_subtest_attempt_subtest_id_tryout_subtest_id_fk" FOREIGN KEY ("subtest_id") REFERENCES "public"."tryout_subtest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_subtest_question" ADD CONSTRAINT "tryout_subtest_question_subtest_id_tryout_subtest_id_fk" FOREIGN KEY ("subtest_id") REFERENCES "public"."tryout_subtest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_subtest_question" ADD CONSTRAINT "tryout_subtest_question_question_id_tryout_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."tryout_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_user_answer" ADD CONSTRAINT "tryout_user_answer_attempt_id_tryout_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."tryout_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_user_answer" ADD CONSTRAINT "tryout_user_answer_question_id_tryout_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."tryout_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_user_answer" ADD CONSTRAINT "tryout_user_answer_selected_choice_id_tryout_question_choice_id_fk" FOREIGN KEY ("selected_choice_id") REFERENCES "public"."tryout_question_choice"("id") ON DELETE set null ON UPDATE no action;