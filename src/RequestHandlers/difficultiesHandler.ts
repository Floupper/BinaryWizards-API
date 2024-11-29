import { Request, Response } from 'express';
import { get_all_difficulties } from '../Repositories/difficultiesRepository';

export async function get_all(req: Request, res: Response) {
    const difficulties = await get_all_difficulties();

    if (difficulties)
        res.json(difficulties);
    else
        res.status(404).json({ error: 'Error while finding difficulties.' });
}