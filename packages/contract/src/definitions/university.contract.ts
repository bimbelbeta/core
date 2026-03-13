import { programYearlyData, studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../lib/contract-definition";

const ListInput = type({
	cursor: "number?",
	limit: "number = 15",
	search: "string?",
});

const UniversityListOutputItem = createSelectSchema(university)
	.pick("name", "slug", "logo", "location", "rank")
	.merge({ id: "number" });

const ListOutput = type({
	data: UniversityListOutputItem.array(),
	nextCursor: "number?",
});

const ListStudyProgramsOutputItem = type({
	id: "number",
	name: "string",
	slug: "string",
	logo: "string | null",
	studyProgram: "string",
	score: "number | null",
	location: "string | null",
	rank: "number | null",
});

const ListStudyProgramsOutput = type({
	data: ListStudyProgramsOutputItem.array(),
	nextCursor: "number?",
});

const StudyProgramOutput = createSelectSchema(studyProgram).pick("name").merge({ id: "number" });

const UniversityDetailOutput = createSelectSchema(university)
	.pick("name", "slug", "logo", "description", "location", "website", "rank")
	.merge({ id: "number" });

const YearlyDataOutput = createSelectSchema(programYearlyData).pick(
	"year",
	"averageGrade",
	"passingGrade",
	"applicantCount",
	"passedCount",
);

const StudyProgramWithYearlyDataOutput = type({
	"...": createSelectSchema(universityStudyProgram)
		.pick("tuition", "capacity", "accreditation")
		.merge({ id: "number" }),
	name: "string",
	category: "string",
	yearlyData: YearlyDataOutput.array(),
});

const FindOutput = type({
	university: UniversityDetailOutput,
	studyPrograms: StudyProgramWithYearlyDataOutput.array(),
});

export const universityContract = {
	listPrograms: oc
		.route({
			path: "/universities/study-programs",
			method: "GET",
			tags: ["Universities", "Study Programs"],
		})
		.input(ListInput)
		.output(ListStudyProgramsOutput),
	list: oc
		.route({
			path: "/universities",
			method: "GET",
			tags: ["Universities"],
		})
		.input(ListInput)
		.output(ListOutput),
	listProgramsByUniversity: oc
		.route({
			path: "/universities/{universityId}/study-programs",
			method: "GET",
			tags: ["Universities", "Study Programs"],
		})
		.input(type({ universityId: "number" }))
		.output(
			type({
				data: StudyProgramOutput.array(),
			}),
		),
	find: oc
		.route({
			path: "/universities/{id}",
			method: "GET",
			tags: ["Universities"],
		})
		.input(type({ id: "number" }))
		.output(FindOutput),
};
