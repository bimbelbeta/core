import { drizzle } from "drizzle-orm/node-postgres";
import * as credit from "./schema/credit";
import * as question from "./schema/question";
import * as subject from "./schema/subject";
import * as transaction from "./schema/transaction";
import * as tryout from "./schema/tryout";
import * as university from "./schema/university";

export const db = drizzle({
	connection: {
		connectionString: process.env.DATABASE_URL || "",
		...(process.env.NODE_ENV !== "production"
			? {
					ssl: false,
				}
			: undefined),
	},
	casing: "snake_case",
	schema: {
		...credit,
		...question,
		...transaction,
		...tryout,
		...subject,
		...university,
	},
});
