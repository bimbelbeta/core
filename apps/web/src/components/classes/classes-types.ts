import type { BodyOutputs } from "@/utils/orpc";

export type SubjectListItem = {
	id: number;
	name: string;
	shortName: string;
	description: string | null;
	order: number;
	category: "sd" | "smp" | "sma" | "utbk";
	gradeLevel: number | null;
	totalContent?: number;
	hasViewed?: boolean;
};

export type ContentListItem = NonNullable<BodyOutputs["subject"]["listContentBySubjectCategory"]>["items"][number];

export type ContentActionItem = {
	hasVideo: boolean | unknown;
	hasNote: boolean | unknown;
	hasPracticeQuestions: boolean | unknown;
};

export type LastContentViewedItem = ContentActionItem & {
	id: number;
	title: string;
};

export type SubjectFilter = "all" | "sd" | "smp" | "sma" | "utbk";
export type ContentFilter = "all" | "video" | "notes" | "quiz";
