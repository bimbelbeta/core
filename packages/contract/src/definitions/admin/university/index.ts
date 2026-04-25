import { adminStudyProgramsContract } from "./study-programs.contract";
import { adminUniversitiesContract } from "./universities.contract";
import { adminUniversityProgramsContract } from "./yearly-data.contract";

export const adminUniversityContract = {
	universities: adminUniversitiesContract,
	studyPrograms: adminStudyProgramsContract,
	universityPrograms: adminUniversityProgramsContract,
};
