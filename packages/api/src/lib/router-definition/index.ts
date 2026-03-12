import { implement } from "@orpc/server";
import type { Context } from "../../context";
import { contract } from "@bimbelbeta/contract";

const os = implement(contract)

export const o = os.$context<Context>()
