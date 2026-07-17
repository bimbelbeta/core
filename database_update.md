# Panduan Pembaruan Database: Skema Kode Referal (Database Update Guide: Referral Code Schema)

Dokumen ini berisi panduan langkah demi langkah untuk memperbarui database PostgreSQL *live* (produksi) Anda dengan tabel baru untuk sistem Kode Referal (`referral_code` dan `referral_usage`).
*(This document contains step-by-step instructions to update your live PostgreSQL database with the new tables for the Referral Code system).*

---

## Bahasa Indonesia

Karena ini adalah database *live* (produksi), **JANGAN PERNAH** menggunakan perintah `bun db:push` atau `bun db:reset` secara sembarangan, karena dapat menyebabkan hilangnya data jika terjadi perubahan skema yang tidak terduga. Cara paling aman adalah menggunakan sistem migrasi bawaan Drizzle atau mengeksekusi SQL secara manual.

### Opsi 1: Menggunakan Migrasi Drizzle (Sangat Disarankan)

1. **Pastikan Koneksi Database Produksi**
   Ubah file `.env` di server atau mesin lokal Anda (jika melakukan migrasi dari lokal) agar `DATABASE_URL` mengarah ke database PostgreSQL produksi Anda.
   ```env
   DATABASE_URL="postgresql://user:password@host:port/namadatabase"
   ```

2. **Buat File Migrasi SQL**
   Jalankan perintah berikut di terminal (berada di dalam folder `core`):
   ```bash
   bun db:generate
   ```
   *Perintah ini akan membaca skema di `core/packages/db/src/schema` dan membuat file SQL (misalnya `0000_...sql`) di dalam folder migrasi (`drizzle` / tujuan migrasi yang diatur).*

3. **Terapkan Migrasi ke Database**
   Setelah file SQL terbuat, jalankan perintah ini untuk menerapkan perubahan ke database produksi:
   ```bash
   bun db:migrate
   ```
   *Drizzle akan secara otomatis mengeksekusi SQL untuk membuat tabel `referral_code` dan `referral_usage` tanpa mengganggu data yang sudah ada.*

### Opsi 2: Eksekusi SQL Manual

Jika Anda menggunakan *dashboard* seperti Supabase, pgAdmin, atau Neon, Anda bisa menjalankan perintah SQL berikut secara langsung di SQL Editor Anda.

```sql
-- Tambahkan constraint unique ke kolom name di tabel user (Pembaruan Fitur Login)
ALTER TABLE "user" ADD CONSTRAINT "user_name_unique" UNIQUE("name");

-- Buat tabel referral_code
CREATE TABLE IF NOT EXISTS "referral_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"max_usages" integer,
	"valid_until" timestamp,
	"premium_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "referral_code_code_unique" UNIQUE("code")
);

-- Buat tabel referral_usage
CREATE TABLE IF NOT EXISTS "referral_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"referral_code_id" text NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_usage_user_id_referral_code_id_unique" UNIQUE("user_id","referral_code_id")
);

-- Tambahkan Foreign Key
DO $$ BEGIN
 ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "referral_usage" ADD CONSTRAINT "referral_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "referral_usage" ADD CONSTRAINT "referral_usage_referral_code_id_referral_code_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_code"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
```

---

## English

Since this is a live (production) database, **NEVER** indiscriminately use the `bun db:push` or `bun db:reset` commands, as they can cause data loss if there are unexpected schema conflicts. The safest method is to use Drizzle's built-in migration system or execute the raw SQL manually.

### Option 1: Using Drizzle Migrations (Highly Recommended)

1. **Ensure Production Database Connection**
   Modify the `.env` file on your server or local machine (if migrating remotely) so that `DATABASE_URL` points directly to your production PostgreSQL database.
   ```env
   DATABASE_URL="postgresql://user:password@host:port/databasename"
   ```

2. **Generate SQL Migration Files**
   Run the following command in your terminal (inside the `core` folder):
   ```bash
   bun db:generate
   ```
   *This command will read the schemas in `core/packages/db/src/schema` and create an SQL file (e.g., `0000_...sql`) in the migrations folder.*

3. **Apply Migrations to the Database**
   Once the SQL file is generated, run this command to apply the changes to the live database:
   ```bash
   bun db:migrate
   ```
   *Drizzle will automatically execute the SQL to create the `referral_code` and `referral_usage` tables without disrupting any existing data.*

### Option 2: Manual SQL Execution

If you are using a database dashboard like Supabase, pgAdmin, or Neon, you can run the following SQL commands directly in your SQL Editor.

```sql
-- Add unique constraint to the name column in the user table (Login Feature Update)
ALTER TABLE "user" ADD CONSTRAINT "user_name_unique" UNIQUE("name");

-- Create referral_code table
CREATE TABLE IF NOT EXISTS "referral_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"max_usages" integer,
	"valid_until" timestamp,
	"premium_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "referral_code_code_unique" UNIQUE("code")
);

-- Create referral_usage table
CREATE TABLE IF NOT EXISTS "referral_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"referral_code_id" text NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_usage_user_id_referral_code_id_unique" UNIQUE("user_id","referral_code_id")
);

-- Add Foreign Keys
DO $$ BEGIN
 ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "referral_usage" ADD CONSTRAINT "referral_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "referral_usage" ADD CONSTRAINT "referral_usage_referral_code_id_referral_code_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_code"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
```
