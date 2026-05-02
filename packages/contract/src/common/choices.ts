import { questionChoice } from "@bimbelbeta/db/schema/question";
import { createSelectSchema } from "drizzle-arktype";

/**
 * Shared choice schemas for use across contracts.
 *
 * Previously these were independently defined in subject.contract.ts,
 * tryout.contract.ts, and admin/question.contract.ts, causing duplication
 * and drift risk.
 */

/** Choice schema without correct answer — used for displaying choices to students. */
export const ChoiceSchema = createSelectSchema(questionChoice)
	.pick("code")
	.merge({ id: "number", content: "string" });

/** Choice schema with correct answer — used for review and scoring. */
export const ChoiceWithAnswerSchema = createSelectSchema(questionChoice)
	.pick("code", "content", "isCorrect")
	.merge({ id: "number" });