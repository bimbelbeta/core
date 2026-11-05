import { useNavigate, useSearch } from "@tanstack/react-router";
import { type SubjectCategory, subjectCategorySchema } from "@/lib/schemas";
import { withoutSearchKey } from "@/lib/tanstack-router-utils";

type QuestionType = "multiple_choice" | "multiple_choice_complex" | "essay";
type QuestionCategory = SubjectCategory;

function isQuestionType(v: string): v is QuestionType {
	return v === "multiple_choice" || v === "multiple_choice_complex" || v === "essay";
}
function isQuestionCategory(v: string): v is QuestionCategory {
	return subjectCategorySchema.allows(v);
}

export function useQuestionsSearch() {
	const navigate = useNavigate({ from: "/admin/questions/" });
	const {
		after,
		before,
		limit = 10,
		search,
		type: questionType,
		category,
		tag,
	} = useSearch({ from: "/admin/questions/" });

	const baseParams = {
		...(search && { search }),
		...(questionType && { type: questionType }),
		...(category && { category }),
		...(tag && { tag }),
		limit,
	};

	const handleSearch = (value: string) => {
		const rest = withoutSearchKey(baseParams, "search");
		navigate({ search: value ? { ...rest, search: value } : rest });
	};

	const handleTypeChange = (value: string) => {
		const rest = withoutSearchKey(baseParams, "type");
		navigate({ search: value !== "all" && isQuestionType(value) ? { ...rest, type: value } : rest });
	};

	const handleCategoryChange = (value: string) => {
		const rest = withoutSearchKey(baseParams, "category");
		navigate({ search: value !== "all" && isQuestionCategory(value) ? { ...rest, category: value } : rest });
	};

	const handleNext = (endCursor: string) => {
		navigate({ search: { after: endCursor, ...baseParams } });
	};

	const handlePrevious = (startCursor: string) => {
		navigate({ search: { before: startCursor, ...baseParams } });
	};

	return {
		searchParams: { after, before, limit, search, questionType, category, tag },
		handleSearch,
		handleTypeChange,
		handleCategoryChange,
		handleNext,
		handlePrevious,
	};
}
