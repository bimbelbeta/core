import type { RouterClient } from "@orpc/server";
import { type } from "arktype";
import { pub } from "../index";
import { adminPracticePackRouter } from "./admin/practice-pack";
import { adminSubjectRouter } from "./admin/subject";
import { flashcardRouter } from "./flashcard";
import { practicePackRouter } from "./practice-pack";
import { socialRouter } from "./social";
import { subjectRouter } from "./subject";
import { transactionRouter } from "./transaction";
import { tryoutRouter } from "./tryout";

export const appRouter = {
	healthCheck: pub
		.route({
			path: "/healthcheck",
			method: "GET",
			tags: ["Uncategorized"],
		})
		.output(type({ message: "string" }))
		.handler(() => {
			return { message: "OK" };
		}),
	social: socialRouter,
	practicePack: practicePackRouter,
	flashcard: flashcardRouter,
	subject: subjectRouter,
	tryout: tryoutRouter,
	admin: {
		practicePack: adminPracticePackRouter,
		subject: adminSubjectRouter,
	},
	transaction: transactionRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
