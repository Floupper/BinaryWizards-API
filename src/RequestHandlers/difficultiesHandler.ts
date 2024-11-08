import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export async function get_all(req: Request, res: Response) {
    const filePath = path.join(__dirname, '../Data/difficulties.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file difficulties.json:', err);
            res.status(500).json({ error: 'Error while retrieving difficulties.' });
            return;
        }

        try {
            const difficulties = JSON.parse(data);
            res.json(difficulties);
        } catch (parseError) {
            console.error('Error while parsing file difficulties.json:', parseError);
            res.status(500).json({ error: 'Error processing difficulties.' });
        }
    });
}