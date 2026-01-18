import type { BodyOutputs } from "@/utils/orpc";

export type SubtestListItem = NonNullable<BodyOutputs["subtest"]["listSubtests"]>[number];

export type ContentListItem = NonNullable<BodyOutputs["subtest"]["listContentByCategory"]>[number];

export type ContentActionItem = {
	hasVideo: boolean;
	hasNote: boolean;
	hasPracticeQuestions: boolean;
};

export type LastContentViewedItem = ContentActionItem & {
	id: number;
	title: string;
};

export type ContentFilter = "all" | "material" | "tips_and_trick";
