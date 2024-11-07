import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export async function get_all(req: Request, res: Response) {
    const filePath = path.join(__dirname, '../Data/categories.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file categories.json:', err);
            res.status(500).json({ error: 'Error while retrieving categories.' });
            return;
        }

        try {
            const categories = JSON.parse(data);
            res.json(categories);
        } catch (parseError) {
            console.error('Error while parsing file categories.json:', parseError);
            res.status(500).json({ error: 'Error processing categories.' });
        }
    });
}