import { Request, Response, NextFunction } from 'express';
import { assert } from 'superstruct';
import { QUIZID } from '../Validation/quiz';
import { get_quiz } from '../Repositories/quizzesRepository';

export function validateQuizId(req: Request, res: Response, next: NextFunction) {
    const { quiz_id } = req.params;

    try {
        assert(quiz_id, QUIZID);
        next();
    } catch (error) {
        res.status(400).json({ error: 'The quiz id is invalid' });
    }
}


export async function checkQuizAccess(req: Request, res: Response, next: NextFunction) {
    const { quiz_id } = req.params;
    const user = req.user;

    try {
        const quiz = await get_quiz(quiz_id);

        if (!quiz) {
            res.status(404).json({ error: 'Quiz not found' });
            return;
        }

        if (quiz.userUser_id) {
            if (!user) {
                res.status(403).json({ error: 'You have to sign in to access this quiz' });
                return;
            } else if (quiz.userUser_id !== user.user_id) {
                res.status(403).json({ error: 'You are not authorized to access this quiz' });
                return;
            }
        }

        req.quiz = quiz;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}