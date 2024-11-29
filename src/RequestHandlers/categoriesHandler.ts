import { Request, Response } from 'express';
import axios from 'axios';


export async function get_all(req: Request, res: Response) {
    const response = await axios.get('https://opentdb.com/api_category.php');

    if (response.data.trivia_categories)
        res.json(response.data.trivia_categories);
    else
        res.status(404).json({ error: 'Error while finding categories.' });
}