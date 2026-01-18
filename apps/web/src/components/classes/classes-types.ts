import type { BodyOutputs } from "@/utils/orpc";

export type SubjectListItem = NonNullable<BodyOutputs["subject"]["listSubjects"]>[number] & {
	category?: "sd" | "smp" | "sma" | "utbk";
	gradeLevel?: number | null;
	hasViewed?: boolean;
};

export type ContentListItem = NonNullable<BodyOutputs["subject"]["listContentBySubjectCategory"]>[number];

export type ContentActionItem = {
	hasVideo: boolean;
	hasNote: boolean;
	hasPracticeQuestions: boolean;
};

export type LastContentViewedItem = ContentActionItem & {
	id: number;
	title: string;
};

export type SubjectFilter = "all" | "sd" | "smp" | "sma" | "utbk";
