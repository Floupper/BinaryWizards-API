import { Request, Response } from 'express';
import { assert } from 'superstruct';
import { persist_game } from '../Repositories/gamesRepository';
import { get_quiz } from '../Repositories/quizzesRepository';
import { QUIZID } from '../Validation/quiz';


export async function create_one(req: Request, res: Response) {
    const { quiz_id } = req.params;
    try {
        assert(quiz_id, QUIZID);
    } catch (error) {
        res.status(400).json({ message: 'The quiz id is invalid' });
        return;
    }

    try {
        const quiz = await get_quiz(quiz_id);

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        if (!quiz.is_public) {
            return res.status(403).json({ error: 'The quiz is private' });
        }

        const user_id = req.user?.user_id || null;

        const newGame = await persist_game(quiz_id, user_id);

        res.status(201).json({ message: 'Game created', game_id: newGame.game_id });
    } catch (error) {
        console.error('Error while creating game :', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
