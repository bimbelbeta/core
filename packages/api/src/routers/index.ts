import type { RouterClient } from "@orpc/server";
import { type } from "arktype";
import { pub } from "../index";
import { adminRouter } from "./admin";
import { subjectRouter } from "./subject";
import { transactionRouter } from "./transaction";
import { tryoutRouter } from "./tryout";
import { universityRouter } from "./university";

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
	subject: subjectRouter,
	tryout: tryoutRouter,
	university: universityRouter,
	admin: adminRouter,
	transaction: transactionRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
