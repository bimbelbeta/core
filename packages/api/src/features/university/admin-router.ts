import { adminImplementer } from "@/lib/router-definition";
import { universityService } from "./service";

const admin = adminImplementer;

const universities = {
	list: admin.admin.university.universities.list.handler(async ({ input }) => {
		return universityService.listAdminUniversities(input);
	}),
	find: admin.admin.university.universities.find.handler(async ({ input }) => {
		return universityService.findAdminUniversity(input);
	}),
	create: admin.admin.university.universities.create.handler(async ({ input }) => {
		return universityService.createUniversity(input);
	}),
	update: admin.admin.university.universities.update.handler(async ({ input }) => {
		return universityService.updateUniversity(input);
	}),
	remove: admin.admin.university.universities.remove.handler(async ({ input }) => {
		return universityService.deleteUniversity(input);
	}),
};

const studyPrograms = {
	list: admin.admin.university.studyPrograms.list.handler(async ({ input }) => {
		return universityService.listStudyPrograms(input);
	}),
	find: admin.admin.university.studyPrograms.find.handler(async ({ input }) => {
		return universityService.findStudyProgram(input);
	}),
	create: admin.admin.university.studyPrograms.create.handler(async ({ input }) => {
		return universityService.createStudyProgram(input);
	}),
	update: admin.admin.university.studyPrograms.update.handler(async ({ input }) => {
		return universityService.updateStudyProgram(input);
	}),
	remove: admin.admin.university.studyPrograms.remove.handler(async ({ input }) => {
		return universityService.deleteStudyProgram(input);
	}),
};

const universityPrograms = {
	list: admin.admin.university.universityPrograms.list.handler(async ({ input }) => {
		return universityService.listUniversityPrograms(input);
	}),
	find: admin.admin.university.universityPrograms.find.handler(async ({ input }) => {
		return universityService.findUniversityProgram(input);
	}),
	create: admin.admin.university.universityPrograms.create.handler(async ({ input }) => {
		return universityService.createUniversityProgram(input);
	}),
	update: admin.admin.university.universityPrograms.update.handler(async ({ input }) => {
		return universityService.updateUniversityProgram(input);
	}),
	remove: admin.admin.university.universityPrograms.remove.handler(async ({ input }) => {
		return universityService.deleteUniversityProgram(input);
	}),
	upsert: admin.admin.university.universityPrograms.upsert.handler(async ({ input }) => {
		return universityService.upsertYearlyData(input);
	}),
	removeYearlyData: admin.admin.university.universityPrograms.removeYearlyData.handler(async ({ input }) => {
		return universityService.removeYearlyData(input);
	}),
};

export const adminUniversityRouter = {
	universities,
	studyPrograms,
	universityPrograms,
};
