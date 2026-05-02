import { useNavigate, useSearch } from "@tanstack/react-router";

type QuestionType = "multiple_choice" | "multiple_choice_complex" | "essay";
type QuestionCategory = "sd" | "smp" | "sma" | "utbk";

function isQuestionType(v: string): v is QuestionType {
	return v === "multiple_choice" || v === "multiple_choice_complex" || v === "essay";
}
function isQuestionCategory(v: string): v is QuestionCategory {
	return v === "sd" || v === "smp" || v === "sma" || v === "utbk";
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
		navigate({
			search: {
				...(value && { search: value }),
				...(questionType && { type: questionType }),
				...(category && { category }),
				...(tag && { tag }),
				limit,
			},
		});
	};

	const handleTypeChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(value !== "all" && isQuestionType(value) && { type: value }),
				...(category && { category }),
				...(tag && { tag }),
				limit,
			},
		});
	};

	const handleCategoryChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(questionType && { type: questionType }),
				...(value !== "all" && isQuestionCategory(value) && { category: value }),
				...(tag && { tag }),
				limit,
			},
		});
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
