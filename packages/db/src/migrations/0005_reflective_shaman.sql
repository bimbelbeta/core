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
ALTER TABLE "tryout_attempt" ADD COLUMN "used_access_code" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tryout_attempt" ADD COLUMN "access_code_id" integer;--> statement-breakpoint
ALTER TABLE "tryout_access_code" ADD CONSTRAINT "tryout_access_code_tryout_id_tryout_id_fk" FOREIGN KEY ("tryout_id") REFERENCES "public"."tryout"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tryout_access_code_tryout_id" ON "tryout_access_code" USING btree ("tryout_id");--> statement-breakpoint
ALTER TABLE "tryout_attempt" ADD CONSTRAINT "tryout_attempt_access_code_id_tryout_access_code_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."tryout_access_code"("id") ON DELETE set null ON UPDATE no action;