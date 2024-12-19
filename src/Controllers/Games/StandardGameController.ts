import { persist_game, update_game_status } from '../../Repositories/gamesRepository';

import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { SocketError } from '../../Sockets/SocketError';
import { Games } from '@prisma/client';

export class StandardGameController implements GameControllerInterface {
    async init(quiz_id: string, user_id: string | null, data: any) {
        return await this.init_standard_game(quiz_id, user_id);
    }

    async join(game: Games, user: any, data: any) {
        throw new SocketError(`The game mode ${game.mode} does not support the join game action.`);
    }

    async start(game: Games) {
        throw new SocketError(`The game mode ${game.mode} does not support the start game action.`);
    }



    async init_standard_game(quiz_id: string, user_id: string | null) {
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

    async game_informations(game: any): Promise<any> {
        throw new SocketError(`The game mode ${game.mode} does not support the game informations action.`);
    }
}

