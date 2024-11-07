import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export async function get_all(req: Request, res: Response) {
    const filePath = path.join(__dirname, '../Data/categories.json');
    console.log("filepath: " + filePath);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier categories.json:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des catégories.' });
            return;
        }

        try {
            const categories = JSON.parse(data);
            res.json(categories);
        } catch (parseError) {
            console.error('Erreur lors du parsing du fichier categories.json:', parseError);
            res.status(500).json({ error: 'Erreur lors du traitement des catégories.' });
        }
    });
}