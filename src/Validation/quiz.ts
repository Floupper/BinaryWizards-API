import { object, string, number, optional, refine } from 'superstruct';

const Category = optional(refine(number(), 'Category', (value) => { // Category must be between 9 and 32 because Open Trivia Database uses a range of categories from 9 to 32.
    return value >= 9 && value <= 32;
}));

export const QuizCreationData = object({
    category: Category,
    difficulty: optional(string()),
    amount: number(),
});