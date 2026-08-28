# Patch Notes

This document contains incremental updates, patch logs, and developer instructions for deployment and codebase maintenance.

---

## Direct Login with Username or Email

### Goal
Allow users to log in using either their **Username** or **Email** address alongside their password. The login field now accepts both, and the appropriate Better-Auth sign-in method is dispatched based on the input.

### Code Changes & Logic

#### 1. Login UI Form
- **File**: `core/apps/web/src/routes/_auth/login.tsx`
- **Changes**:
  - Renamed form field from `name` to `identifier`; label updated to `"Username/Email"`.
  - Added `autoComplete="username"` to the input for browser autocomplete compatibility.
  - Extracted the shared post-login navigation logic into a local `onSignInSuccess` helper (DRY — was duplicated in both sign-in paths).
  - `onSubmit` now checks if `value.identifier` contains `"@"`:
    - **Contains `@`** → calls `authClient.signIn.email` (email-based sign-in).
    - **Does not contain `@`** → calls `authClient.signIn.username` (username/`name`-based sign-in).
  - The old commented-out email-only block has been removed and replaced with this clean dual-path implementation.
  - All other UI, error handling, Google sign-in, and register link logic are **unchanged**.

#### 2. Backend / Auth Client
- **No changes required.**
  - `packages/auth/src/index.ts` already had both `emailAndPassword` and `username` (mapped to `name` column) plugins enabled.
  - `apps/web/src/lib/auth-client.ts` already had `usernameClient()` registered on the client.

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

---

## Tryout Timer UI Glitch Fix

### Goal
Fix a visual bug where the Tryout subtest timer would flash `00:00:00` and display the "Lanjut" button for 1 second upon loading before displaying the correct remaining time and the "Mulai" button.

### Code Changes & Logic
- **File**: `core/apps/web/src/routes/_authenticated/tryout/-hooks/use-countdown.ts`
- **Change**: Added an immediate `setCountDown(Math.max(countDownDate - Date.now(), 0));` call inside the `useEffect` hook.
- **Logic**: The previous implementation relied solely on `setInterval`, causing the React state to hold a stale initialization value (24 hours placeholder) for 1 full second before the first tick. The exact 24-hour placeholder caused modulo arithmetic to yield `"00:00:00"`, tricking the UI into an expired state. The immediate state update perfectly syncs the UI with the fetched deadline on mount.

---

## Fixed Default Password on Registration

### Goal
Simplify the registration UX by automatically assigning a fixed password (`"BimbelBeta"`) to every new account. Users no longer need to input or remember a password during sign-up — they always log in with `"BimbelBeta"`.

### Code Changes & Logic

#### 1. Registration Form — Submit Handler
- **File**: `core/apps/web/src/routes/_auth/register.tsx`
- **Change**: In the `onSubmit` handler, the `password` field passed to `authClient.signUp.email` is now hardcoded to `"BimbelBeta"` instead of reading from `value.password`.

#### 2. Registration Form — Validation Schema
- **File**: `core/apps/web/src/routes/_auth/register.tsx`
- **Change**: The `password` validator rule (`type("string >= 8")`) in the Arktype `onSubmit` schema is commented out. This prevents the form from blocking submission due to an empty hidden field.

#### 3. Registration Form — UI Fields Hidden
- **File**: `core/apps/web/src/routes/_auth/register.tsx`
- **Change**: The `<form.Field name="password">` and `<form.Field name="confirm_password">` JSX blocks are **commented out** (not deleted) so they can be restored easily. The `defaultValues` for `password` and `confirm_password` remain in the form state as-is.

### No Backend Changes Required
> [!NOTE]
>> Better-Auth's `signUp.email` still receives a valid password (`"BimbelBeta"`). No changes to `packages/auth`, contracts, or any API router were needed. The login flow (Section 3.2) is untouched — users log in with their Username/Email and the fixed password `"BimbelBeta"`.

---

## Tryout Title Display in Frontend (3.8)

### Goal
Display the tryout name (as set by the admin) in the header area of the tryout page, above the subtest card. Fills the blank space that was previously empty.

### Code Changes & Logic

#### 1. Tryout Page Layout
- **File**: `core/apps/web/src/routes/_authenticated/tryout/$tryoutId.tsx`
- **Change**: The back button container in `view === "greeting"` was changed from a `flex items-center` row into a `flex flex-col gap-1` column. A `<h1>` tag rendering `data.title` was added below the back button.
- **Why no API change needed**: The `orpc.tryout.find` endpoint already spreads `...tryoutData` which includes `title` from the `tryout` table. The `title` field was already present in `TryoutSchema` used by the contract output — it simply wasn't being rendered.

### No Backend Changes Required
> [!NOTE]
> The `title` field was already returned by the existing `orpc.tryout.find` query. No changes to API, contracts, or database were needed.

---

## Uncensor Tryout Access Code in Admin Panel (3.9)

### Goal
Make access codes fully readable in the admin Tryout settings page (instead of showing masked codes like `TEST*****`), and add a copy button for convenience.

### Code Changes & Logic

#### 1. Backend — Stop Masking on Creation
- **File**: `core/packages/api/src/routers/admin/tryout/index.ts`
- **Change**: In the `createAccessCode` handler, changed `codePreview: maskCode(plainCode)` to `codePreview: plainCode`. The full plain code is now stored in the `codePreview` column at creation time.
- **Why**: The DB schema only stores `codeHash` (for lookup) and `codePreview` (display-only). There is no separate plain-code column. The cleanest solution without a DB migration is to store the full code in `codePreview` directly.

#### 2. Frontend — Monospace Display + Copy Button
- **File**: `core/apps/web/src/routes/admin/tryouts/$tryoutId/-components/tryout-settings-tab.tsx`
- **Change**:
  - Changed the code display from `<p className="text-muted-foreground text-xs">` to a `<div className="flex items-center gap-1">` containing a `<p className="font-mono text-xs">` for the code and a `<button>` with `CopyIcon` that calls `navigator.clipboard.writeText()` and shows a toast on success.
  - Added `CopyIcon` to the `@phosphor-icons/react` import.

### Important Note for Existing Codes
> [!WARNING]
> Codes created **before** this patch will still display their old masked value (e.g., `TEST*****`) since the masking happened at insert time. Only **newly created** codes will show the full plain code. Old codes can be deactivated and recreated to show the full code.

---

## Allow Space in Username for Login (3.10)

### Goal
Fix the `422 Unprocessable Content` error that occurred when users with spaces in their name (e.g., "Pelangi Jingga") tried to log in via username. Better-Auth's username plugin blocked spaces by default.

### Code Changes & Logic

#### 1. Auth Configuration — Custom Username Validator
- **File**: `core/packages/auth/src/index.ts`
- **Change**: Added `usernameValidator: (value) => /^[a-zA-Z0-9 ]+$/.test(value.trim())` to the `username()` plugin options.
- **Logic**: This regex permits letters, numbers, and spaces (the most common character in Indonesian names). `.trim()` is applied before testing to handle any leading/trailing spaces cleanly, without rejecting the username.

### No Frontend Changes Required
> [!NOTE]
> The login form's sign-in flow (`authClient.signIn.username`) was already correct. The 422 was purely a server-side validation rejection from the username plugin. Fixing the validator on the auth config resolves the issue end-to-end.

---

## Split Tryout Landing Page by Level (TKA / UTBK)

### Goal
Split the public tryout landing page into two level variants so users can switch between **TKA** and **UTBK** from the same screen. UTBK keeps the current behavior and layout, while TKA uses the same page structure without the Passing Grade tab.

### Code Changes & Logic

#### 1. Tryout Landing Page
- **File**: `core/apps/web/src/routes/_authenticated/tryout/index.tsx`
- **Change**:
  - Added a top-level level selector above the hero banner with two buttons: `TKA` and `UTBK`.
  - Added a `level` search param so the chosen variant persists through refresh and navigation.
  - Extracted the hero text into a level config so the banner can change copy per variant.
  - Kept UTBK's three tabs unchanged: `Guideline`, `Passing Grade`, and `Hasil TryOut`.
  - Hid the `Passing Grade` tab and component entirely when `level=tka`.
  - Reset level switching to the default tab for the chosen level so TKA cannot inherit an invalid UTBK tab state.

### Behavior Notes
- UTBK remains visually and functionally the same as before.
- TKA reuses the same landing-page structure and CTA area, but only shows `Guideline` and `Hasil TryOut`.
- No backend, contract, or database changes were needed for this update.

---

## Published Tryout Visibility on Student Dashboard

### Goal
Make every Try Out with status `published` visible on the student dashboard so siswa can choose a specific TO by title and category before entering the code.

### Code Changes & Logic

#### 1. Tryout List Contract and API
- **Files**:
  - `core/packages/contract/src/definitions/tryout.contract.ts`
  - `core/packages/api/src/routers/tryout/index.ts`
- **Change**: The tryout list response now includes `category` in addition to the existing title and scheduling fields.
- **Logic**: The student-facing `tryout.list` endpoint already filters by `status = published`; the response now carries enough metadata for the dashboard to render title + category cards.

#### 2. Student Tryout Dashboard
- **File**: `core/apps/web/src/routes/_authenticated/tryout/-components/results-activity.tsx`
- **Change**:
  - Added a published-tryout section below the existing result history block.
  - Each card shows the Try Out title and category, plus a start button that reuses the existing access-code flow.
  - Added a loading skeleton and an empty state for when no published TO is available.

#### 3. Tryout Start Dialog
- **File**: `core/apps/web/src/routes/_authenticated/tryout/-components/tryout-start-confirmation.tsx`
- **Change**: The dialog now accepts an optional `tryoutId`, so the same access-code / premium / credit logic can be used for a specific selected TO instead of only the featured one.

### Notes
- The existing featured tryout flow is preserved.
- No database schema changes were needed.

---

## Tryout Guideline Category Filter Fix

### Goal
Fix the 500/output validation issue on the Tryout dashboard after introducing level-based filtering, so published tryouts render correctly under the active level tab.

### Code Changes & Logic

#### 1. Featured Tryout API Output
- **File**: `core/packages/api/src/routers/tryout/index.ts`
- **Change**: Added `category` to the `featured` tryout query output so the response matches the contract and can be consumed safely by the guideline card and level-aware filtering.

#### 2. Tryout List Contract
- **File**: `core/packages/contract/src/definitions/tryout.contract.ts`
- **Change**: The list item schema already includes `category`, keeping the published tryout response consistent for student-facing filtering.

#### 3. Student Tryout Guideline Page
- **File**: `core/apps/web/src/routes/_authenticated/tryout/-components/guideline-activity.tsx`
- **Change**: Published tryouts are now filtered by active level:
  - `TKA` shows only `SD`, `SMP`, and `SMA`
  - `UTBK` shows only `UTBK`
- **Logic**: The TO list is still pulled from the existing published tryout endpoint, but the page now narrows the visible cards based on the selected top-level tab.

