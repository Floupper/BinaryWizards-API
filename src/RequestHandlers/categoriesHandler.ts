import { Request, Response } from 'express';
import axios from 'axios';

const cache: { [key: string]: any } = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
let cacheTimestamp = 0;

export async function get_all(req: Request, res: Response) {
    const cacheKey = 'trivia_categories';

    // Verifying if cache valid
    const now = Date.now();
    if (cache[cacheKey] && now - cacheTimestamp < CACHE_DURATION) {
        console.log('Using cache for categories');
        res.json(cache[cacheKey]);
        return;
    }
    console.log('Cache expired for categories');

    try {
        const response = await axios.get('https://opentdb.com/api_category.php');

        if (response.data.trivia_categories) {
            cache[cacheKey] = response.data.trivia_categories;
            cacheTimestamp = now;

            res.json(response.data.trivia_categories);
        } else {
            res.status(404).json({ error: 'Error while finding categories.' });
        }
    } catch (error) {
        console.error('An error occurred while fetching categories :', error);
        res.status(500).json({ error: 'An error occurred while fetching categories.' });
    }
}
