import { object, string, number, optional, refine, size, pattern } from 'superstruct';

const Category = optional(refine(number(), 'Category', (value) => { // Category must be between 9 and 32 because Open Trivia Database uses a range of categories from 9 to 32.
    return value >= 9 && value <= 32;
}));

export const QuizCreationData = object({
    category: Category,
    difficulty: optional(string()),
    amount: size(number(), 1, 50),
});


export const UUID = pattern(
    string(),
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
);