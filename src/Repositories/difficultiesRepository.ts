import fs from 'fs';
import path from 'path';


export const DifficultyPoints: { [key: string]: number } = {
    'easy': 1,
    'medium': 2,
    'hard': 3,
};

export async function get_all_difficulties() {
    const filePath = path.join(__dirname, '../Data/difficulties.json');

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const difficulties = JSON.parse(data);
        return difficulties;
    } catch (err) {
        console.error('Error reading or parsing file difficulties.json:', err);
        return null;
    }
}