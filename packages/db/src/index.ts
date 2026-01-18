import type { PostgresJsDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import * as flashcard from "./schema/flashcard";
import * as practice from "./schema/practice-pack";
import * as subject from "./schema/subject";
import * as transaction from "./schema/transaction";
import * as tryout from "./schema/tryout";
import * as university from "./schema/university";

export const db: PostgresJsDatabase = drizzle({
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
		...subject,
		...university,
	},
});
