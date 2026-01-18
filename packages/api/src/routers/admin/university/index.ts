import { adminStudyProgramRouter } from "./study-programs";
import { adminUniversityRouter as adminUniversitySubrouter } from "./universities";
import { adminUniversityProgramRouter } from "./yearly-data";

export const adminUniversityRouter = {
	universities: adminUniversitySubrouter,
	studyPrograms: adminStudyProgramRouter,
	universityPrograms: adminUniversityProgramRouter,
};
