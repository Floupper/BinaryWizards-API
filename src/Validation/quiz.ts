import { object, string, number, optional, refine, size, pattern, boolean, enums } from 'superstruct';

const Category = refine(number(), 'Category', (value) => { // Category must be between 9 and 32 because Open Trivia Database uses a range of categories from 9 to 32.
    return value >= 9 && value <= 32;
});

export const QuizCreationData = object({
    category: Category,
    difficulty: string(),
    amount: size(number(), 1, 50),
    title: optional(string())
});

export const QuestionImportData = object({
    category: Category,
    difficulty: string(),
    amount: size(number(), 1, 50)
});


export const QuizUpdateData = object({
    difficulty: optional(enums(['easy', 'medium', 'hard'])),
    title: optional(string()),
    is_public: optional(boolean())
});

export const QUIZID = pattern(
    string(),
    /^QU[A-Z0-9]{6}$/i
);