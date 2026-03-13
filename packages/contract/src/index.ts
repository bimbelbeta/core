import { adminContract } from "./definitions/admin";
import { creditContract } from "./definitions/credit.contract";
import { healthCheckContract } from "./definitions/health.contract";
import { productContract } from "./definitions/product.contract";
import { subjectContract } from "./definitions/subject.contract";
import { transactionContract } from "./definitions/transaction.contract";
import { tryoutContract } from "./definitions/tryout.contract";
import { universityContract } from "./definitions/university.contract";
import { userSettingsContract } from "./definitions/user-settings.contract";

export const contract = {
	healthCheck: healthCheckContract,
	admin: adminContract,
	credit: creditContract,
	subject: subjectContract,
	product: productContract,
	transaction: transactionContract,
	tryout: tryoutContract,
	university: universityContract,
	userSettings: userSettingsContract,
};

// Export the orpc errors helpers so runtime code can construct typed errors
// Also export a typed alias named `errors` for clearer runtime imports
export { oc, oc as errors } from "./lib/contract-definition";
