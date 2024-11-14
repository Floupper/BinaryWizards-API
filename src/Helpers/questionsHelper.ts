import { DifficultyPoints } from "../Repositories/difficultiesRepository";
import { get_all_questions, get_total_questions } from "../Repositories/questionsRepository";

export async function calculate_max_score(quiz_id: string): Promise<number> {
    let maxScore = 0;

    const questions = await get_all_questions(quiz_id);

    for (const question of questions) {
        const difficulty = question.question_difficulty.toLowerCase();
        const points = DifficultyPoints[difficulty] || 1;
        maxScore += points;
    }

    return maxScore;
}


export async function get_total_questions_count(quiz_id: string) {
    return await get_total_questions(quiz_id);
}