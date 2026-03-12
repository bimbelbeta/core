import { contract } from "@bimbelbeta/contract";
import { implement } from "@orpc/server";
import type { Context } from "../../context";

const os = implement(contract);

export const o = os.$context<Context>();
