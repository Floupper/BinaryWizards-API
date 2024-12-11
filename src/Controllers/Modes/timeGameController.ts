import { persist_game } from '../../Repositories/gamesRepository';

export async function init_time_game(quiz_id: string, user_id: string | null, difficulty_level: string) {
    const newGame = await persist_game(
        quiz_id,
        user_id,
        'time',
        difficulty_level,
        null,
        'started', // Directly started because its a solo gamemode
    );

    return newGame;
}