import { Request, Response, NextFunction } from 'express';
import { assert } from 'superstruct';
import { UUID } from '../Validation/uuid';

export async function validateQuestionId(req: Request, res: Response, next: NextFunction) {
    const { question_id } = req.params;

    try {
        assert(question_id, UUID);

        next();
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'The question id is invalid' });
    }
}