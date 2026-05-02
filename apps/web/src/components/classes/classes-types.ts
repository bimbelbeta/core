import type { BodyOutputs } from "@/utils/orpc";

export type SubjectListItem = BodyOutputs["subject"]["list"]["items"][number];

export type ContentListItem = NonNullable<BodyOutputs["subject"]["listContent"]>["items"][number];

export type ContentActionItem = {
	hasVideo: boolean;
	hasNote: boolean;
	hasPracticeQuestions: boolean;
	videoCompleted?: boolean | null;
	noteCompleted?: boolean | null;
	practiceQuestionsCompleted?: boolean | null;
};

export type LastContentViewedItem = ContentActionItem & {
	id: number;
	title: string;
};

export type SubjectCategory = SubjectListItem["category"];
export type SubjectFilter = "all" | SubjectCategory;
export type ContentFilter = "all" | "video" | "notes" | "quiz";
