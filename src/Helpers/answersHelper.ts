import { count_correct_answers, get_correct_answers } from "../Repositories/answersRepository";
import { DifficultyPoints } from "../Repositories/difficultiesRepository";

export async function calculate_score(quiz_id: string) {
    try {
        const correctAnswers = await get_correct_answers(quiz_id) || [];;

        let totalScore = 0;

        for (const answer of correctAnswers) {
            const difficulty = answer.Questions?.question_difficulty.toLowerCase();
            const points = DifficultyPoints[difficulty] || 1; // Default to 1 if difficulty is unknown
            totalScore += points;
        }

        return totalScore;
    } catch (error) {
        console.error("Error while calculating score :", error);
        throw new Error("Error while calculating score");
    }
}


export async function get_correct_answers_count(quiz_id: string) {
    return await count_correct_answers(quiz_id);
}