import { drizzle } from "drizzle-orm/node-postgres";
import * as flashcard from "./schema/flashcard";
import * as practice from "./schema/practice-pack";
import * as transaction from "./schema/transaction";
import * as tryout from "./schema/tryout";

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
		...practice,
		...flashcard,
		...transaction,
		...tryout,
	},
});
