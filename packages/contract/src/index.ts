import { adminContract } from "@/definitions/admin";
import { creditContract } from "@/definitions/credit.contract";
import { healthCheckContract } from "@/definitions/health.contract";
import { productContract } from "@/definitions/product.contract";
import { referralContract } from "@/definitions/referral.contract";
import { subjectContract } from "@/definitions/subject.contract";
import { transactionContract } from "@/definitions/transaction.contract";
import { tryoutContract } from "@/definitions/tryout.contract";
import { universityContract } from "@/definitions/university.contract";
import { userSettingsContract } from "@/definitions/user-settings.contract";

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
	referral: referralContract,
};
