import { useNavigate } from "@tanstack/react-router";
import { Route } from "../index";

type QuestionType = "multiple_choice" | "multiple_choice_complex" | "essay";
type QuestionCategory = "sd" | "smp" | "sma" | "utbk";

export function useQuestionsSearch() {
	const navigate = useNavigate({ from: "/admin/questions/" });
	const { after, before, limit = 10, search, type: questionType, category, tag } = Route.useSearch();

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
				...(value !== "all" && { type: value as QuestionType }),
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
				...(value !== "all" && { category: value as QuestionCategory }),
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
