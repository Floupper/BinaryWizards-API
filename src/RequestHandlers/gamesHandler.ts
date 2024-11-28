import { Request, Response } from 'express';
import { assert } from 'superstruct';
import { persist_game } from '../Repositories/gamesRepository';
import { get_quiz } from '../Repositories/quizzesRepository';
import { QUIZID } from '../Validation/quiz';
import { get_games_by_user } from '../Repositories/usersRepository';
import { get_total_questions_count } from '../Helpers/questionsHelper';


export async function create_one(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        const quiz = await get_quiz(quiz_id);

        if (!quiz) {
            res.status(404).json({ error: 'Quiz not found' });
            return;
        }

        if (quiz.type == 0) {
            res.status(403).json({ error: 'The quiz is private' });
            return;
        }

        const user_id = req.user?.user_id || null;
        let newGame;

        if (quiz.type == 2) {
            newGame = await persist_game(quiz_id, null);
        }
        else {
            newGame = await persist_game(quiz_id, user_id);

        }


        res.status(201).json({ message: 'Game created', game_id: newGame.game_id });
    } catch (error) {
        console.error('Error while creating game :', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function get_started_by_user(req: Request, res: Response): Promise<void> {
    const user = req.user;

    try {
        if (user) { // user is already authenticated (verified in middleware), condition for ts errors
            const started_games = await get_games_by_user(user.user_id);

            const unfinished_games = await Promise.all(
                started_games.map(async (game) => {
                    const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
                    if (game.current_question_index < nb_questions_total) {
                        return { ...game, nb_questions_total };
                    }
                    return null;
                })
            );

            res.status(200).json(unfinished_games);
        }
    } catch (error) {
        console.error('Error fetching started games:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}