import { decrement_questions_index, get_total_questions, increment_questions_index } from "../Repositories/questionsRepository";
import { SocketError } from "../Sockets/SocketError";


export async function get_total_questions_count(quiz_id: string) {
    return await get_total_questions(quiz_id);
}


export async function change_questions_indexes(quiz_id: string, currentIndex: number, newIndex: number) {
    if (newIndex !== currentIndex) {
        if (newIndex < currentIndex) {
            await increment_questions_index(quiz_id, currentIndex, newIndex);
        } else if (newIndex > currentIndex) {
            await decrement_questions_index(quiz_id, currentIndex, newIndex);
        }
    }
}


export function get_correct_option_index(question: any) {
    const correctOption = question.options.find(
        (option: any) => option.is_correct_answer
    );

    if (!correctOption) {
        throw new SocketError('Correct answer not found');
    }

    return correctOption.option_index;
}