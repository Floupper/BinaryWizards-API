import { persist_game } from '../../Repositories/gamesRepository';

export async function init_stadard_game(quiz_id: string, user_id: string | null) {
    const newGame = await persist_game(
        quiz_id,
        user_id,
        'standard',
        null,
        null,
        'started', // Directly started because its a solo gamemode
    );

    return newGame;
}