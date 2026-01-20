import type { RouterClient } from "@orpc/server";
import { type } from "arktype";
import { pub } from "../index";
import { adminSubjectRouter } from "./admin/subject";
import { adminUniversityRouter } from "./admin/university";
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
  admin: {
    subject: adminSubjectRouter,
    university: adminUniversityRouter,
  },
  transaction: transactionRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
