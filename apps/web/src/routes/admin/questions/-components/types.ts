import type { BodyOutputs } from "@/utils/orpc";

type ApiChoice = BodyOutputs["admin"]["tryout"]["questions"]["find"]["choices"][number];

export type Choice = Pick<ApiChoice, "id" | "code" | "content" | "isCorrect">;
