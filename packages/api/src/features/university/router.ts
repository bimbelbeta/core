import { authedNoPremiumImplementer } from "@/lib/router-definition";
import { universityService } from "./service";

const authed = authedNoPremiumImplementer;

const listPrograms = authed.university.listPrograms.handler(async ({ input }) => {
	return universityService.listPrograms(input);
});

const list = authed.university.list.handler(async ({ input }) => {
	return universityService.listUniversities(input);
});

const listProgramsByUniversity = authed.university.listProgramsByUniversity.handler(async ({ input }) => {
	return universityService.listProgramsByUniversity(input);
});

const find = authed.university.find.handler(async ({ input }) => {
	return universityService.findUniversity(input);
});

export const universityRouter = {
	listPrograms,
	list,
	listProgramsByUniversity,
	find,
};
