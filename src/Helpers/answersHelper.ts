import { count_correct_answers, get_correct_answers } from "../Repositories/answersRepository";


export async function get_correct_answers_count(game_id: string) {
    return await count_correct_answers(game_id);
}