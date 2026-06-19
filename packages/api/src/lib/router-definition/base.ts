import { contract } from "@bimbelbeta/contract";
import { implement } from "@orpc/server";
import type { Context } from "@/context";

export const baseImplementer = implement(contract).$context<Context>();
