import { object, number, size, string, boolean, refine, array, optional } from 'superstruct';

const OptionContentStruct = object({
    type: string(), // 'text', 'image', 'audio'
    content: string(),
});

const OptionStruct = object({
    option_index: number(),
    is_correct_answer: boolean(),
    optionContent: OptionContentStruct,
});

export const QuestionAnswerData = object({
    question_index: number(),
    option_index: size(number(), 0, 3),
});

export const QuestionCreationData = object({
    question_text: string(),
    question_difficulty: string(),
    question_category: string(),
    question_type: string(),
    options: refine(array(OptionStruct), 'options', (options) => options.length > 1),
});

export const QuestionUpdateData = object({
    question_index: optional(number()),
    question_text: optional(string()),
    question_difficulty: optional(string()),
    question_category: optional(string()),
    question_type: optional(string()),
    options: optional(refine(array(OptionStruct), 'options', (options) => options.length > 1)),
});