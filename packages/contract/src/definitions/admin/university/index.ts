import { adminStudyProgramsContract } from "@/definitions/admin/university/study-programs.contract";
import { adminUniversitiesContract } from "@/definitions/admin/university/universities.contract";
import { adminUniversityProgramsContract } from "@/definitions/admin/university/yearly-data.contract";

export const adminUniversityContract = {
	universities: adminUniversitiesContract,
	studyPrograms: adminStudyProgramsContract,
	universityPrograms: adminUniversityProgramsContract,
};
