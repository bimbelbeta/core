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
