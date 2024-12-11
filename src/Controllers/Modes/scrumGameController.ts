import { add_player_to_scrum_game, persist_game } from '../../Repositories/gamesRepository';

export async function init_scrum_game(quiz_id: string, user_id: string, max_players: number) {
    const newGame = await persist_game(
        quiz_id,
        user_id,
        'scrum',
        null,
        max_players,
        'pending',
    );

    // Adding creator to the game
    await add_player_to_scrum_game(newGame.game_id, user_id!);

    return newGame;
}