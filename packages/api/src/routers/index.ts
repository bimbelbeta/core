import type { RouterClient } from "@orpc/server";
import { creditRouter } from "@/features/credit/router";
import { productRouter } from "@/features/product/router";
import { referralRouter } from "@/features/referral/router";
import { baseImplementer } from "@/lib/router-definition/base";
import { adminRouter } from "@/routers/admin";
import { subjectRouter } from "@/routers/subject";
import { transactionRouter } from "@/routers/transaction";
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
