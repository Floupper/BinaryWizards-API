import { object, number, size } from 'superstruct';


export const QuestionAnswerData = object({
    question_index: size(number(), 1, 50),
    option_index: size(number(), 0, 3),
});