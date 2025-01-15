import { object, number, size, string, boolean, refine, array, optional, enums } from 'superstruct';


const OptionStruct = object({
    option_index: number(),
    is_correct_answer: boolean(),
    option_content: string(),
});

export const QuestionAnswerData = object({
    question_index: number(),
    option_index: size(number(), -1, 7),
});

export const QuestionCreationData = object({
    question_text: string(),
    question_difficulty: enums(['easy', 'medium', 'hard']),
    question_category: string(),
    question_type: enums(['text', 'image', 'audio']),
    options: refine(array(OptionStruct), 'options', (options) => options.length > 1),
});

export const QuestionUpdateData = object({
    question_index: optional(number()),
    question_text: optional(string()),
    question_difficulty: optional(enums(['easy', 'medium', 'hard'])),
    question_category: optional(string()),
    question_type: optional(enums(['text', 'image', 'audio'])),
    options: optional(refine(array(OptionStruct), 'options', (options) => options.length > 1)),
});


export const CompleteOptionsData = object({
    question_text: string(),
    options_type: enums(['realistic', 'humouristic', 'mixt']),
    nb_options: size(number(), 2, 8)
});