# Patch Notes

This document contains incremental updates, patch logs, and developer instructions for deployment and codebase maintenance.

---

## Direct Login with Name and Password (No Email)

### Goal
Enforce login using purely the `name` column as a username (no email required for user sign-in) utilizing Better-Auth's `username` plugin.

### Action Required for Developers / Admins
> [!IMPORTANT]
> - The Drizzle schema (`core/packages/db/src/schema/auth.ts`) has been updated to mark `name` as `.unique()`.
> - **Since the live database does not enforce unique constraints on the `name` column, developers/administrators must manually add a unique constraint/index to the `name` column of the `user` table on the live database** (or execute a safe schema migration to apply it) before deploying this patch. 
> - Do **NOT** run database resets (`db:reset`) or destructive migrations on production data.

### Code Changes & Logic

#### 1. Database Schema
- **File**: `core/packages/db/src/schema/auth.ts`
- **Change**: Added `.unique()` to the `name` column on the `user` table.
- **Logic**: Enforces unique username mapping for all registered users.

#### 2. Better-Auth Server Configuration
- **File**: `core/packages/auth/src/index.ts`
- **Change**: Registered the `username` plugin and mapped both `username` and `displayUsername` fields to the existing `name` column:
  ```typescript
  plugins: [
      username({
          schema: {
              user: {
                  fields: {
                      username: "name",
                      displayUsername: "name",
                  },
              },
          },
      }),
  ],
  ```

#### 3. Better-Auth Client Configuration
- **File**: `core/apps/web/src/lib/auth-client.ts`
- **Change**: Added `usernameClient` plugin to the client-side `plugins` array.
- **Logic**: Grants client-side capability to call `authClient.signIn.username`.

#### 4. Login UI Form
- **File**: `core/apps/web/src/routes/_auth/login.tsx`
- **Change**: 
  - Adjusted form state and validation schemas to target `name` instead of `email`.
  - Configured form submission to call `authClient.signIn.username` using the `name` field value.
  - Commented out the old email input field and its sign-in method for safety and easy rollback.

---

## Bulk Delete User Management

### Goal
Allow super admins to select multiple users in the dashboard and delete them at once, similar to the functionality available on the questions page.

### Code Changes & Logic

#### 1. Backend API (oRPC Contract & Router)
- **Files**: 
  - `core/packages/contract/src/definitions/admin/users.contract.ts` 
  - `core/packages/api/src/routers/admin/users.ts`
- **Change**: Added the `deleteBatch` endpoint that accepts an array of `userIds`.
- **Logic**: Utilizes a Drizzle query with `inArray(user.id, input.userIds)` to execute a bulk delete operation on the `user` table. 

#### 2. Frontend Admin UI
- **File**: `core/apps/web/src/routes/admin/_superadmin/users/index.tsx`
- **Change**: 
  - Implemented a checkbox column within the TanStack-based data table, enabling "Select All" and individual row selection.
  - Added the `AdminTableBulkActions` bar that conditionally renders when one or more users are selected.
  - Integrated an `AlertDialog` for deletion confirmation to prevent accidental removals.
  - Hooked up the `deleteBatch` mutation to the UI to execute the API call and immediately trigger a refetch of the users list on success.

---

## Referral Code System

### Goal
Implement a complete Referral Code system that allows superadmins to create and manage codes, and authenticated users to redeem them for time-limited Premium access. Redemption is atomic (database transaction + row-level lock) to prevent race conditions.

### Action Required for Developers / Admins
> [!IMPORTANT]
> This patch adds two new tables to the database: `referral_code` and `referral_usage`.
> **The schema has already been pushed to the local dev database via `bun db:push`.**
> For the **live/production database**, one of the following must be run:
> - `bun db:push` — if the database is accessible from dev machine and you are comfortable with non-migration-file approach (same as all previous patches in this project).
> - Or manually execute the two `CREATE TABLE` statements from the generated migration.
> **Do NOT run `bun db:reset`** — this will wipe all production data.

> [!TIP]
> The two new tables are lightweight and additive — they reference the existing `user` table via foreign keys with `ON DELETE CASCADE` / `ON DELETE SET NULL`. No existing tables are altered.

### Code Changes & Logic

#### 1. Database Schema
- **File**: `core/packages/db/src/schema/referral.ts` **[NEW]**
- **Change**: Two new Drizzle schema tables:
  - `referral_code` — stores code metadata: `id`, `code` (unique, alphanumeric), `status`, `usageCount`, `maxUsages` (nullable = unlimited), `validUntil` (nullable), `premiumDays`, `createdAt`, `updatedAt`, `createdBy`.
  - `referral_usage` — audit log of which user redeemed which code. Has a **composite unique constraint** on `(userId, referralCodeId)` as a database-level race condition defense against duplicate redemptions.
- **File**: `core/packages/db/src/index.ts` **[MODIFIED]**
- **Change**: Registered both new tables in the Drizzle db schema object.

#### 2. API Contracts
- **File**: `core/packages/contract/src/definitions/admin/referral.contract.ts` **[NEW]**
- **Change**: Admin oRPC contracts: `list`, `create`, `updateStatus`, `bulkDeactivate`, `getUsages`.
  - Code inputs enforce alphanumeric-only via Arktype regex with auto-uppercase.
- **File**: `core/packages/contract/src/definitions/referral.contract.ts` **[NEW]**
- **Change**: Public `redeemReferral` contract for authenticated users. Input auto-uppercased.
- **File**: `core/packages/contract/src/definitions/admin/index.ts` **[MODIFIED]**
- **Change**: Mounted `adminReferralContract` on the admin contract.
- **File**: `core/packages/contract/src/index.ts` **[MODIFIED]**
- **Change**: Mounted `referralContract` on the root contract.

#### 3. Backend API Logic
- **File**: `core/packages/api/src/routers/admin/referral.ts` **[NEW]**
- **Change**: Superadmin CRUD router:
  - `list` — cursor-paginated, searchable, filterable by status.
  - `create` — validates alphanumeric uniqueness; auto-generates codes with `PREM` prefix + 6 random alphanumeric chars if no code provided.
  - `updateStatus` — toggle active/inactive on a single code.
  - `bulkDeactivate` — batch set `status = false` for selected codes.
  - `getUsages` — paginated join of `referralUsage` + `user` table for a specific code, returning usage details.
- **File**: `core/packages/api/src/routers/referral.ts` **[NEW]**
- **Change**: Authenticated `redeem` endpoint inside `db.transaction()`:
  1. Uppercases input code.
  2. Acquires **row-level lock** (`SELECT ... FOR UPDATE`) on the `referralCode` row.
  3. Validates: code exists, `status = true`, `validUntil` not expired.
  4. Validates: `maxUsages` is `null` (unlimited) OR `usageCount < maxUsages`.
  5. Checks: user has not already redeemed this code (via `referralUsage` lookup).
  6. Inserts audit record into `referralUsage` (DB unique constraint catches any concurrent race).
  7. Increments `usageCount` atomically.
  8. **Accumulates** premium: if user already has active future premium, extends from that date; otherwise starts from today.
- **File**: `core/packages/api/src/routers/admin/index.ts` **[MODIFIED]**
- **File**: `core/packages/api/src/routers/index.ts` **[MODIFIED]**
- **Change**: Both index files mount the respective new routers.

#### 4. Frontend — Admin
- **File**: `core/apps/web/src/components/admin/app-sidebar.tsx` **[MODIFIED]**
- **Change**: Added "Referral Codes" nav link (superadmin-only) pointing to `/admin/referrals`.
- **File**: `core/apps/web/src/routes/admin/_superadmin/referrals/index.tsx` **[NEW]**
- **Change**: Admin management page for referral codes matching the `/admin/users` layout:
  - Data table with columns: Status, Code, Usage/Max, Valid Until, Premium Days, Actions.
  - "+ Buat Kode Referal" button opens a modal; code input enforces alphanumeric-only (auto-uppercase), `maxUsages` defaults to empty = unlimited.
  - Per-row toggle active/inactive button; arrow button links to detail page.
  - Bulk deactivate with checkbox selection + AlertDialog confirmation.
- **File**: `core/apps/web/src/routes/admin/_superadmin/referrals/$codeId.tsx` **[NEW]**
- **Change**: Detail page showing:
  - Code metadata card (status, usage count, premium days, validity).
  - Summary card (total claimants, active premium count).
  - Table of all users who claimed the code (Name → links to user detail, Email, Premium status, Premium expiry, Claimed at).

#### 5. Frontend — User
- **File**: `core/apps/web/src/routes/_authenticated/premium.tsx` **[MODIFIED]**
- **Change**: Added `<ReferralSection />` component at the bottom of the premium page:
  - Styled card: "Punya kode referal?" with a monospace, auto-uppercase, alphanumeric-only text input.
  - Submit button disables and shows spinner during the API call (anti-spam).
  - Inline client-side validation rejects non-alphanumeric codes before hitting the API.
  - Server error messages surface via `sonner` toast (all in Indonesian: "Kode tidak ditemukan / salah", "Kode sudah kedaluwarsa", "Kuota kode sudah habis", "Anda sudah pernah menggunakan kode ini").
  - On success: opens a success `Dialog` showing the new premium expiry date in Indonesian locale.

### Known Limitations
> [!WARNING]
> Due to the current session caching mechanism, after a user successfully redeems a referral code, the frontend state might not immediately unlock premium content on the current page. The user must **reload the page** for the new premium status to be reflected in the UI. This should be communicated to the user or handled gracefully in a future patch.
