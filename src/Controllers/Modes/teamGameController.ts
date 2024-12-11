import { persist_game } from '../../Repositories/gamesRepository';

export async function init_team_game(quiz_id: string, user_id: string | null, difficulty_level: string) {
    const newGame = await persist_game(
        quiz_id,
        user_id,
        'team',
        difficulty_level,
        null,
        'pending',
    );

    return newGame;
}