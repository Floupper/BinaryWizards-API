import { object, number, size, string, boolean, refine, array } from 'superstruct';

const OptionStruct = object({
    option_text: string(),
    is_correct_answer: boolean(),
});

export const QuestionAnswerData = object({
    question_index: size(number(), 1, 50),
    option_index: size(number(), 0, 3),
});

export const QuestionCreationData = object({
    question_text: string(),
    question_difficulty: string(),
    question_category: string(),
    question_type: string(),
    options: refine(array(OptionStruct), 'options', (options) => options.length > 1),
});

