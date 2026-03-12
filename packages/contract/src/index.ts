import { creditContract } from "./definitions/credit.contract";
import { productContract } from "./definitions/product.contract";
import { subjectContract } from "./definitions/subject.contract";
import { transactionContract } from "./definitions/transaction.contract";
import { universityContract } from "./definitions/university.contract";
import { userSettingsContract } from "./definitions/user-settings.contract";

export const contract = {
	credit: creditContract,
	subject: subjectContract,
	product: productContract,
	transaction: transactionContract,
	university: universityContract,
	userSettings: userSettingsContract,
};
