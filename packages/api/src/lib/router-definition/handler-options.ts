export type HandlerOptions<TProcedure extends { handler: (...args: any[]) => any }> = Parameters<
	Parameters<TProcedure["handler"]>[0]
>[0];
