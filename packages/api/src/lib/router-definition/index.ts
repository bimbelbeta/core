import { contract } from "@bimbelbeta/contract";
import { implement } from "@orpc/server";
import type { Context } from "../../context";

const implementer = implement(contract).$context<Context>();

type AppImplementer = typeof implementer;

export const o: AppImplementer = implementer;
