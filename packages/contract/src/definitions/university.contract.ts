import { type } from "arktype";
import { oc } from "../lib/contract-definition";

const ListInput = type({
	cursor: "number?",
	limit: "number = 15",
	search: "string?",
});

const UniversityListOutputItem = type({
	id: "number",
	name: "string",
	slug: "string",
	logo: "string | null",
	location: "string | null",
	rank: "number | null",
});

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

const StudyProgramOutput = type({
	id: "number",
	name: "string",
});

const UniversityDetailOutput = type({
	id: "number",
	name: "string",
	slug: "string",
	logo: "string | null",
	description: "string | null",
	location: "string | null",
	website: "string | null",
	rank: "number | null",
});

const YearlyDataOutput = type({
	year: "number",
	averageGrade: "number | null",
	passingGrade: "number | null",
	applicantCount: "number | null",
	passedCount: "number | null",
});

const StudyProgramWithYearlyDataOutput = type({
	id: "number",
	name: "string",
	category: "string",
	tuition: "number | null",
	capacity: "number | null",
	accreditation: "string | null",
	yearlyData: YearlyDataOutput.array(),
});

const FindOutput = type({
	university: UniversityDetailOutput,
	studyPrograms: StudyProgramWithYearlyDataOutput.array(),
});

export const universityContract = {
	listStudyPrograms: oc
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
	listStudyProgramsByUniversity: oc
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
