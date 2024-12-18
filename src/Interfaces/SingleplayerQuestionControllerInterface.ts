import { Request, Response } from 'express';

export interface SingleplayerQuestionControllerInterface {
    get_one(req: Request, res: Response): Promise<void>;
    send_answer(req: Request, res: Response): Promise<void>;
}