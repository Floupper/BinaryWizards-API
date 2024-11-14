import { Request, Response } from 'express';
import { get_all_categories } from '../Repositories/categoriesRepository';


export async function get_all(req: Request, res: Response) {
    const categories = await get_all_categories();

    if (categories)
        res.json(categories);
    else
        res.status(404).json({ message: 'Error while finding categories.' });
}