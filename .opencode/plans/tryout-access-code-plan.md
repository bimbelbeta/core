# Tryout Access Code Plan (Per-Tryout)

## Goal
Add per-tryout access codes so non-premium users can start a tryout without uploading payment proof, and be treated as premium for discussion access when the code is valid.

## Scope
- Add attempt-level tracking for code usage.
- Add dedicated storage for tryout access codes/passwords.
- Update tryout start flow to validate code input.
- Update review/discussion permission logic.
- Update user UI to input access code when starting tryout.
- Add admin management for per-tryout access codes.

## High-Level Design

### 1) Database Changes
#### A. `tryout_attempt` additions
- Add `usedAccessCode` (boolean, default `false`).
- Add `accessCodeId` (nullable integer FK to access code table).

Purpose:
- Explicitly record whether a user used a code.
- Preserve auditability of which code unlocked the attempt.

#### B. New dedicated table: `tryout_access_code`
Suggested columns:
- `id` (PK)
- `tryoutId` (FK to `tryout.id`, cascade delete)
- `code` (text, not null)
- `label` (text, nullable; admin note)
- `isActive` (boolean, default `true`)
- `expiresAt` (timestamp, nullable)
- `maxUses` (integer, nullable)
- `usedCount` (integer, default `0`)
- `createdAt`, `updatedAt`

Indexes/constraints:
- index on `tryoutId`
- unique on `(tryoutId, codeHash)` for deduplication

Security:
- Store code (`code`) plaintext. (we dont need security for this)

### 2) Backend Tryout Flow Updates
File target: `packages/api/src/routers/tryout.ts`

#### A. Update start input
Current:
- `{ id, imageUrl?, useCredit? }`

New:
- `{ id, imageUrl?, useCredit?, accessCode? }`

#### B. Access decision logic in `/tryouts/{id}/start`
Allow start if any of these is true:
- user is premium
- `imageUrl` present
- valid `useCredit` with sufficient balance
- valid `accessCode` for that tryout

If `accessCode` provided:
- lookup by `tryoutId`
- verify `isActive`, not expired, usage limit not exceeded
- compare against hashed value
- in transaction:
  - create attempt with `usedAccessCode: true`, `accessCodeId: ...`
  - increment `usedCount`

Keep current credit/image flows unchanged.

### 3) Discussion Access Rule Update
File target: `packages/api/src/routers/tryout.ts` (review route)

Current:
- `canSeeDiscussion = user.isPremium || attempt.usedCredit`

New:
- `canSeeDiscussion = user.isPremium || attempt.usedCredit || attempt.usedAccessCode`

Result:
- users who enter valid code can view discussions like premium users.

### 4) Admin APIs for Access Code Management
Files target: `packages/api/src/routers/admin/tryout/*`

Add endpoints (per tryout):
- list codes
- create code
- deactivate/reactivate code
- optional: delete code (soft-disable preferred)
- optional: regenerate code

Behavior notes:
- Return plaintext code only at creation time.
- For list endpoint, return masked preview (e.g., `ABCD****`) and metadata (`usedCount`, `maxUses`, `expiresAt`, `isActive`).

### 5) User UI Changes (Tryout Start)
File target:
- `apps/web/src/routes/_authenticated/tryout/-components/tryout-start-confirmation.tsx`

Add in start dialog:
- New option: “Use Access Code”
- Input field for code
- Submit action calls `orpc.tryout.start` with `accessCode`

UX states:
- invalid code
- expired code
- inactive code
- quota exhausted
- success (navigate to tryout)

Keep existing options:
- premium direct start
- upload payment proof
- use credit

### 6) Admin UI Changes
Files target:
- `apps/web/src/routes/admin/tryouts/$tryoutId/-components/tryout-settings-tab.tsx`
- `apps/web/src/routes/admin/tryouts/$tryoutId/-components/tryout-attempts-tab.tsx`

#### A. Settings tab
Add “Access Code” section:
- create new code
- list existing codes
- enable/disable actions
- show metadata (active, expires, usage count)

#### B. Attempts tab
Add “Access Source” info:
- Premium / Credit / Payment Proof / Access Code

Based on attempt flags:
- `usedAccessCode`
- `usedCredit`
- `submittedImageUrl`
- fallback premium context when applicable

### 7) Type and Contract Updates
Potential files:
- `packages/api/src/types/tryout.ts`
- ORPC-inferred client types in web app

Ensure returned attempt payloads include new fields needed by UI/admin.

### 8) Migration & Verification
Run after implementation:
1. generate/apply DB migration
2. `bun build:packages` (required after API router changes)
3. `bun lint:fix`
4. `bun check-types`

### 9) Test Scenarios (Manual + API)
1. Non-premium + valid per-tryout code:
   - can start tryout without image
   - attempt stores `usedAccessCode = true`
   - can see discussion after completion
2. Non-premium + invalid/expired/inactive code:
   - start rejected with clear error
3. Non-premium + no image/no credit/no code:
   - start rejected (existing behavior maintained)
4. Credit flow still works and discussion access unchanged.
5. Premium flow unchanged.
6. Admin can create/disable/list per-tryout codes.
7. Usage limit respected (`maxUses`).

## Rollout Notes
- Backward-compatible: existing attempts remain valid (`usedAccessCode` defaults false).
- No change to existing premium/credit/payment-proof paths except adding code path.
- Prefer soft-disable over hard-delete for audit history.

## Recommended Defaults (Confirmed)
- Code scope: **per-tryout**
- Store code as hash
- Discussion unlocked for attempts started via valid code
- Keep image/credit/premium flows intact
