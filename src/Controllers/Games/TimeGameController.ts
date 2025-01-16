import { Games } from '@prisma/client';
import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { persist_game, update_game_status } from '../../Repositories/gamesRepository';
import { SocketError } from '../../Sockets/SocketError';

export class TimeGameController implements GameControllerInterface {
    async init(quiz_id: string, user_id: string | null, data: any) {
        const { difficulty_level } = data;
        if (!difficulty_level) {
            throw new SocketError('difficulty_level is required for time mode');
        }
        return await this.init_time_game(quiz_id, user_id, difficulty_level);
    }

    async join(game: Games, user: any, data: any) {
        throw new SocketError(`The game mode ${game.mode} does not support the join game action.`);
    }

    async start(game: Games) {
        throw new SocketError(`The game mode ${game.mode} does not support the start game action.`);
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


    async game_informations(game: any, user_id: string): Promise<any> {
        throw new SocketError(`The game mode ${game.mode} does not support the game informations action.`);
    }

    async switch_team(): Promise<void> {
        throw new SocketError('Switching teams is only available in team games.');
    }


    async leave_game(game_id: string, user_id: string): Promise<void> {
        throw new SocketError(`The game mode time does not support the leave game action.`);
    }
}

