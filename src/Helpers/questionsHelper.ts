import { get_total_questions } from "../Repositories/questionsRepository";


export async function get_total_questions_count(quiz_id: string) {
    return await get_total_questions(quiz_id);
}