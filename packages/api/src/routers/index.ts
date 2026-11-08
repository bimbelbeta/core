import type { RouterClient } from "@orpc/server";
import { productRouter } from "@/features/product/router";
import { transactionRouter } from "@/features/transaction/router";
import { baseImplementer } from "@/lib/router-definition/base";
import { adminRouter } from "@/routers/admin";
import { creditRouter } from "@/routers/credit";
import { referralRouter } from "@/routers/referral";
import { subjectRouter } from "@/routers/subject";
import { tryoutRouter } from "@/routers/tryout";
import { universityRouter } from "@/routers/university";
import { userSettingsRouter } from "@/routers/user-settings";

const pub = baseImplementer;

export const appRouter = baseImplementer.router({
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
	referral: referralRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
