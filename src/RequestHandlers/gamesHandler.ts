import { Request, Response } from 'express';
import { UUID } from '../Validation/quiz';
import { assert } from 'superstruct';
import { get_game, persist_game_update } from '../Repositories/gamesRepository';
import { get_total_questions_count } from '../Helpers/questionsHelper';

export async function reset_game(req: Request, res: Response) {
    const { game_id } = req.params;
    try {
        assert(game_id, UUID);
    } catch (error) {
        res.status(400).json({ message: 'The game id is invalid' });
        return;
    }

    try {
        // Verify if game exists
        const game = await get_game(game_id);

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Get the total number of questions in the quiz
        const totalQuestions = await get_total_questions_count(game.quizzesQuiz_id);

        // Verify if the quiz is not finished yet
        if (game.current_question_index < totalQuestions) {
            return res.status(400).json({ error: 'The game have to be finished to be reset' });
        }

        // Reset quiz
        await persist_game_update(game_id, 0);

        res.status(200).json({ message: 'The game has been reset' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
