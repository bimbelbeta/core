# Admin UI refinement plan

Standing score: bimbelbeta admin **7.0** (11 blind judges, 6 rounds). Linear 8.2, GitHub 8.3.

Every mechanical defect those rounds found is fixed. What is left is the two structural findings every judge named:

1. **Type hierarchy is safe, not authored.** Display sizes read "slightly inflated and soft"; levels separate by small size steps instead of sharp weight and tracking steps.
2. **Density is spent on air, not information.** Rows are comfortable but carry one fact where the references carry three.

Both are shared-layer problems, so they get fixed once, then the pages are walked in order.

## Phase 0 — foundation (one commit, reaches every page)

`apps/web/src/index.css`, `apps/web/src/components/admin/admin-table.tsx`, `admin-page.tsx`.

| Token                | Now                   | Target                     | Why                                                          |
| -------------------- | --------------------- | -------------------------- | ------------------------------------------------------------ |
| `text-page-title`    | 24px / 600 / -0.011em | 22px / 600 / -0.02em       | stop the title reading inflated; tracking does the work      |
| `text-section-title` | 16px / 600 / -0.006em | 15px / 600 / -0.012em      | separate it from row titles by weight and tracking, not size |
| `text-row-title`     | 15px / 500            | 14px / 500 / -0.003em      | rows are data, not headings                                  |
| `text-meta`          | 13px / 1.45           | 12.5px / 1.35              | tighter metadata band                                        |
| table head           | 32px, 12px / 600      | 28px, 11.5px / 600 / 70%   | quieter and denser                                           |
| table cell           | 40px, `py-1.5`        | 36px single-line, `py-1.5` | 4px per row                                                  |
| page padding         | `lg:p-8`, `gap-6`     | `lg:p-6`, `gap-5`          | 8px reclaimed on two edges                                   |

Lexend Variable accepts any weight, so 550/620 are available where a step needs to be sharper than 500/600.

Acceptance: dashboard, bank soal, tryout list and users list re-shot at 1440 and 390; no page drops below its current score in one blind re-review; lint, types, tests and build green.

## Phase 1 — one page at a time

Each page gets its own commit and its own blind review. Order is by how much of the product the page is and how much feedback it drew.

### 1. Dashboard — `/admin/dashboard`

Feedback: "a lot of air spent on little data"; the page every judge saw.

- Metric strip: each number gets a second real fact (premium share, question type split, month-over-month delta) instead of a line that restates the label.
- Recent tryouts and recent questions: two-line rows (title plus one metadata line) so five rows carry ten facts.
- Drop section descriptions that restate the heading.
- Metric strip to first list: 20px, not 24px.

### 2. Bank soal — `/admin/questions`

Feedback: "near-universal truncation"; the densest list in the product.

- Rows already clamp to two lines; make the second line earn its place (type, subject, tags) and stop cutting tags at three.
- Columns: question (flex) · type · subject · updated · actions. Dates right-aligned in a fixed column.
- Bulk selection bar only when something is selected; the count lives in the toolbar.

### 3. Tryout list — `/admin/tryouts`

- Row: title, then category · subtest count · attempt count · status · updated.
- The status pill stays the only semantic colour.
- Footer: count left, controls right, 32px targets.

### 4. Users — `/admin/users` (superadmin)

- Name and email in one cell; role and premium as pills in fixed columns; last-active date.
- Bulk action bar matches bank soal.

### 5. Classes — `/admin/classes`, `/admin/classes/$subjectId`

- Subject rows: name, content count, question count, updated.
- Content list: type icon, title, order, status.

### 6. Passing grades — `/admin/passing-grades`, `$universityId`

- University rows: name, program count, score range, updated.
- Program table: program, faculty, passing grade, actions.

### 7. Products and referrals — `/admin/products`, `/admin/referrals`

- Same row-schema discipline; price and status in fixed columns.

### 8. Detail pages

Question detail, tryout detail (settings / subtests / attempts), user detail, referral detail, product detail.

- One header pattern: breadcrumb, title, status pill, primary action.
- Tab bars 32px with an underline indicator, no pill inside a pill.

### 9. Create and edit forms

Question create/edit, tryout settings, product form.

- 640px form width, 12px label to input, 20px between fields, sticky footer holding the primary action.

## Per-page loop

1. Capture at 1440 and 390 into `.review-shots/<page>/`.
2. Blind review: a fresh `delegate_task` that receives only the page screenshots plus `references/linear-*.png` and `references/github-*.png`. Ask for a 1–10 and the three highest-leverage changes. Never mention the target, the history, or the previous score.
3. Apply findings that are measurable or an information-density decision. Log pure taste flips and leave them out.
4. Re-capture and re-review with a new judge. Stop at 9 or above, or after two rounds if the score has not moved and the findings contradict each other.
5. Commit: `refactor(web): <page> — <what changed>`.

## Guardrails

- Lexend only. No font change, no per-page font override.
- One accent: the product teal, `--primary`. Navy is a secondary scale, never the primary. Green, amber and red only for status.
- Every page keeps `AdminPage` and `AdminTable`; no page-local restyling.
- No new token without a call site; no new dependency.
- `bun lint`, `bun check-types`, `bun test` and `bun run build` green per commit.

## Stop rule

If two consecutive pages stall below 9 with contradictory findings, the remaining gap is the typeface and brand decision, not the layout. Escalate instead of iterating.

## Review log

Judges: GLM-5.3-Flash, blind, references scored in the same call (Linear 9.0–9.5, GitHub 8.5–9.0).

| Page           | Round 1 | Round 2 | Outcome |
| -------------- | ------- | ------- | ------- |
| Bank soal      | 7.5     | 7.5     | stopped |
| Tryout list    | 7.0     | 6.8     | stopped |
| Tryout detail  | 6.0     | 7.0     | stopped |

Round 1 applied: checkbox gutter 48→32px, Terbit badge on the soft green, footer keeps the total on single-page datasets, tryout meta wraps without a dangling separator.

Round 2 findings and why they were not applied:

- _Bank soal has a 450px dead zone mid-row._ Measured: the Soal column is 950px of a 1174px table. The whitespace is short question text, not a narrow column. Rejected.
- _Give the tryout list card `min-height: 100vh`._ With one tryout that paints a 600px empty bordered card. Rejected.
- _The sort control is stranded on mobile._ Applied: the trailing control goes full-width below the filter grid instead of sitting alone, right-aligned.

Tryout detail round 1 applied: the 9-column Percobaan table was clipping its empty state mid-word at 390px, so the empty state moved outside the table; disabled filled buttons gained a boundary; Kode akses adopted the shared `Empty`; Subtest gained the Soal and Durasi columns the tab exists for.

Tryout detail round 2 findings and why they were not applied:

- _The Urutan soal cell is blank on the Literasi Bahasa Inggris row._ Measured every `tbody tr`: all four render `Berurutan`. The judge misread two identically named rows. Rejected.
- _Soal and Durasi are left-aligned despite `text-right`._ Measured computed `text-align`: `right` on both the `th` and the `td` of every row. Rejected.
- _The Percobaan empty state offers no next step._ Applied without new navigation: the description now points at the Kode akses tab.
- _Kadaluarsa shows `mm/dd/yyyy` in an Indonesian console._ Real, but the fix is the existing `Calendar` + `Popover` in place of a native `datetime-local`, which belongs to the forms pass below.
