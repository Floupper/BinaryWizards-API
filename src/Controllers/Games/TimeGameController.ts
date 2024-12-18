import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { persist_game, update_game_status } from '../../Repositories/gamesRepository';

export class TimeGameController implements GameControllerInterface {
    async init(quiz_id: string, user_id: string | null, data: any) {
        const { difficulty_level } = data;
        if (!difficulty_level) {
            throw new Error('difficulty_level is required for time mode');
        }
        return await this.init_time_game(quiz_id, user_id, difficulty_level);
    }

    async join(game: any, user: any, data: any) {
        throw new Error(`The game mode ${game.mode} does not support the join game action.`);
    }

    async start(game: any) {
        throw new Error(`The game mode ${game.mode} does not support the start game action.`);
    }

    async init_time_game(quiz_id: string, user_id: string | null, difficulty_level: string) {
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
}

