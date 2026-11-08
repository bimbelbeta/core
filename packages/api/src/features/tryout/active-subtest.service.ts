import { db } from "@bimbelbeta/db";
import { DomainError, rethrowAsInternal } from "@/lib/domain-error";
import { type AnswerFields, createTryoutRepository, type TryoutRepository } from "./repository";

export type ActiveSubtestRepository = Pick<
	TryoutRepository,
	"findOngoingAttemptForSession" | "upsertAnswer" | "toggleAnswerDoubtful"
>;

export type SaveAnswerInput =
	| { tryoutId: number; questionId: number; answerType: "choice"; selectedChoiceId: number }
	| { tryoutId: number; questionId: number; answerType: "complex"; selectedChoiceIds: number[] }
	| { tryoutId: number; questionId: number; answerType: "essay"; essayAnswer: string };

export function createActiveSubtestService({ repository }: { repository: ActiveSubtestRepository }) {
	async function require(tryoutId: number, userId: string) {
		const attempt = await repository.findOngoingAttemptForSession(tryoutId, userId);
		if (!attempt) throw new DomainError("BAD_REQUEST", "Tidak ada pengerjaan yang aktif");

		const subtest = attempt.subtestAttempts.find((item) => item.status === "ongoing");
		if (!subtest) throw new DomainError("BAD_REQUEST", "Tidak ada subtest yang aktif");
		if (subtest.deadline && subtest.deadline < new Date()) {
			throw new DomainError("BAD_REQUEST", "Batas waktu subtest telah habis");
		}

		return attempt.id;
	}

	return {
		require,

		async saveAnswer(input: SaveAnswerInput, userId: string) {
			const attemptId = await require(input.tryoutId, userId);
			const answerFields: AnswerFields = {
				selectedChoiceId: input.answerType === "choice" ? input.selectedChoiceId : null,
				selectedChoiceIds: input.answerType === "complex" ? input.selectedChoiceIds : null,
				essayAnswer: input.answerType === "essay" ? input.essayAnswer : null,
			};
			try {
				await repository.upsertAnswer(attemptId, input.questionId, answerFields);
			} catch (error) {
				throw rethrowAsInternal(error, "Gagal menyimpan jawaban.");
			}
			return { success: true as const };
		},

		async toggleRaguRagu(input: { tryoutId: number; questionId: number }, userId: string) {
			const attemptId = await require(input.tryoutId, userId);
			try {
				await repository.toggleAnswerDoubtful(attemptId, input.questionId);
			} catch (error) {
				throw rethrowAsInternal(error, "Gagal menyimpan status ragu-ragu.");
			}
			return { success: true as const };
		},
	};
}

export const activeSubtestService = createActiveSubtestService({
	repository: createTryoutRepository(db),
});
