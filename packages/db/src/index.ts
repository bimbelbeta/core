import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PoolConfig } from "pg";
import * as auth from "./schema/auth";
import * as credit from "./schema/credit";
import * as question from "./schema/question";
import * as subject from "./schema/subject";
import * as transaction from "./schema/transaction";
import * as tryout from "./schema/tryout";
import * as university from "./schema/university";

// Import all tables for schema definition
const schema = {
	// Auth
	user: auth.user,
	session: auth.session,
	account: auth.account,
	verification: auth.verification,
	// Credit
	creditTransaction: credit.creditTransaction,
	// Question
	question: question.question,
	questionChoice: question.questionChoice,
	// Subject
	subject: subject.subject,
	contentItem: subject.contentItem,
	videoMaterial: subject.videoMaterial,
	noteMaterial: subject.noteMaterial,
	contentPracticeQuestions: subject.contentPracticeQuestions,
	userProgress: subject.userProgress,
	recentContentView: subject.recentContentView,
	userSubjectView: subject.userSubjectView,
	// Transaction
	transaction: transaction.transaction,
	product: transaction.product,
	// Tryout
	tryout: tryout.tryout,
	tryoutSubtest: tryout.tryoutSubtest,
	tryoutSubtestQuestion: tryout.tryoutSubtestQuestion,
	tryoutAttempt: tryout.tryoutAttempt,
	tryoutSubtestAttempt: tryout.tryoutSubtestAttempt,
	tryoutUserAnswer: tryout.tryoutUserAnswer,
	// University
	university: university.university,
	studyProgram: university.studyProgram,
	universityStudyProgram: university.universityStudyProgram,
	programYearlyData: university.programYearlyData,
};

// Define main relations (empty base - all relations defined in parts)
const relations = defineRelations(schema, () => ({}));

function createDb() {
	const connection: PoolConfig = {
		connectionString: process.env.DATABASE_URL || "",
		...(process.env.NODE_ENV !== "production" ? { ssl: false } : {}),
	};

	return drizzle({
		connection,
		schema,
		relations: {
			...relations,
			...auth.authRelations,
			...credit.creditTransactionRelations,
			...question.questionRelations,
			...subject.subjectRelations,
			...tryout.tryoutRelations,
			...university.universityRelations,
		},
	});
}

let _db: ReturnType<typeof createDb> | null = null;

export const db: ReturnType<typeof createDb> = new Proxy({} as ReturnType<typeof createDb>, {
	get(_target, prop) {
		if (!_db) _db = createDb();
		return (_db as unknown as Record<string | symbol, unknown>)[prop];
	},
});
