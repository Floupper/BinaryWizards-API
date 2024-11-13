import fs from 'fs';
import path from 'path';

export async function get_all_categories() {
    const filePath = path.join(__dirname, '../Data/categories.json');

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const categories = JSON.parse(data);
        return categories;
    } catch (err) {
        console.error('Error reading or parsing file categories.json:', err);
        return null;
    }
}