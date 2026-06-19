import type { BodyOutputs } from "@/lib/orpc";

type ApiChoice = BodyOutputs["admin"]["tryout"]["questions"]["find"]["choices"][number];

export type Choice = Pick<ApiChoice, "id" | "code" | "content" | "isCorrect">;
