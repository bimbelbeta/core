import { type } from "arktype";

export const subjectCategorySchema = type("'sd' | 'smp' | 'sma' | 'utbk'");

export const tryoutStatusSchema = type("'draft' | 'published' | 'archived'");
