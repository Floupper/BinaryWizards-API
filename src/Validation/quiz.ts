import { object, string, size, number, optional } from 'superstruct';

export const QuizCreationData = object({
    category: optional(string()),
    difficulty: optional(string()),
    amount: number(),
});