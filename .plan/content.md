# Content Management Implementation Plan

## Current Status: Phase 8 Complete ✅

### ✅ Phase 1: Database Schema Changes (COMPLETED)

**Goal**: Update database schema to support new content structure

**Changes Applied to `packages/db/src/schema/subject.ts`:**

1. ✅ Removed `contentTypeEnum` and `type` column from `contentItem`
2. ✅ Updated unique constraint to `(subjectId, order)` only (was `subjectId, type, order`)
3. ✅ Added `gradeLevel` column to `subject` table (integer, nullable)
4. ✅ Added `userSubjectView` tracking table with:
   - userId, subjectId references
   - viewedAt, createdAt, updatedAt timestamps
   - Unique constraint on (userId, subjectId)
   - Index on userId
5. ✅ Added `userSubjectViews` relation to `subjectRelations`
6. ✅ Added `userSubjectViewRelations` with user and subject relations

**Database Status:**
- ✅ Schema pushed successfully
- ✅ Database seeded (26 subjects: 7 UTBK, 4 SD, 5 SMP, 10 SMA)

---

### ✅ Phase 2: API Routes Updates (COMPLETED)
- ✅ Updated `listSubjects` to include `gradeLevel` and `hasViewed`
- ✅ Added `trackSubjectView` endpoint
- ✅ Removed `type` parameter from content endpoints
- ✅ Updated admin routes (removed type, added gradeLevel validation)

### ✅ Phase 3: Frontend Types (COMPLETED)
- ✅ Updated SubjectListItem type with gradeLevel and hasViewed
- ✅ Removed ContentFilter type

### ✅ Phase 4: Subject Card Component (COMPLETED)
- ✅ Display grade level based on category
- ✅ Show "Sudah Pernah Dibuka" badge

### ✅ Phase 5: Remove ContentFilters Component (COMPLETED)
- ✅ Deleted content-filters.tsx

### ✅ Phase 6: Update User Classes Page (COMPLETED)
- ✅ Removed ContentFilters import and usage
- ✅ Removed category from Search type
- ✅ Fixed query to remove type filtering
- ✅ Added trackSubjectView on mount

### ✅ Phase 7: Update Admin Classes Page (COMPLETED)
- ✅ Removed ContentFilters
- ✅ Removed type-related state
- ✅ Updated create/reorder mutations
- ✅ Simplified UI

### ✅ Phase 8: Rename "Latihan Soal" → "Quiz" (COMPLETED)
- ✅ Renamed route files: `$contentId.latihan-soal.tsx` → `$contentId.quiz.tsx`
- ✅ Updated route paths in navigation
- ✅ Updated all text occurrences
- ✅ Updated tab labels and keys

### ✅ Phase 9: Content Seed Data (COMPLETED)
- ✅ Added gradeLevel to subject seed data
- ✅ SD subjects: grades 5-6
- ✅ SMP subjects: grades 8-9
- ✅ SMA subjects: grades 10-12
- ✅ UTBK: null (no grade level)

### ✅ Phase 10: Database Migration & Build (COMPLETED)
- ✅ Schema pushed to database
- ✅ Database seeded with gradeLevel
- ✅ DB package built successfully
- ✅ API package built successfully
- ✅ Fixed import references (subtest → subject)

### ✅ IMPLEMENTATION COMPLETE!

**All 10 phases completed successfully:**
1. ✅ Database schema changes
2. ✅ API routes updates
3. ✅ Frontend types
4. ✅ Subject card component  
5. ✅ Remove ContentFilters
6. ✅ Update user classes page
7. ✅ Update admin classes page
8. ✅ Rename "Latihan Soal" → "Quiz"
9. ✅ Content seed data
10. ✅ Database migration & build

### Next Steps (Optional/Future):

**Phase 11**: Testing & Verification
- Update `listSubjects` to include `gradeLevel` and `hasViewed`
- Add `trackSubjectView` endpoint
- Remove `type` parameter from content endpoints
- Update admin routes

**Phase 3-11**: Frontend, UI, and Content Seed
- Update components and types
- Remove ContentFilters
- Rename "Latihan Soal" → "Quiz"
- Add content seed data

**Note**: Phases 2-11 will be implemented in separate iterations after Phase 1 is tested.
