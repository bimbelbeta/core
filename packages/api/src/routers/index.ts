import type { RouterClient } from "@orpc/server";
import { pub } from "../index";
import { o } from "../lib/router-definition";
import { adminRouter } from "./admin";
import { creditRouter } from "./credit";
import { productRouter } from "./product";
import { subjectRouter } from "./subject";
import { transactionRouter } from "./transaction";
import { tryoutRouter } from "./tryout";
import { universityRouter } from "./university";
import { userSettingsRouter } from "./user-settings";

export const appRouter = o.router({
	healthCheck: pub.healthCheck.handler(() => {
		return { message: "OK" };
	}),
	subject: subjectRouter,
	tryout: tryoutRouter,
	university: universityRouter,
	admin: adminRouter,
	transaction: transactionRouter,
	credit: creditRouter,
	product: productRouter,
	userSettings: userSettingsRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
