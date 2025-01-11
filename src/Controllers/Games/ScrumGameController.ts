import { Server, Socket } from 'socket.io';
import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { add_player_to_scrum_game, count_players_in_game, get_players_in_game, get_scrum_game_informations, is_scrum_player, persist_game, update_game_status } from '../../Repositories/gamesRepository';
import { SocketError } from '../../Sockets/SocketError';
import { Games } from '@prisma/client';

export class ScrumGameController implements GameControllerInterface {
    private io: Server | null;
    constructor(io: Server | null) {
        this.io = io;
    }

    async init(quiz_id: string, user_id: string | null, data: any) {
        const { max_players } = data;
        if (!user_id) {
            throw new SocketError('You have to be authenticated to create a Scrum game.');
        }
        if (!max_players) {
            throw new SocketError('max_players is required for scrum mode');
        }
        return await this.init_scrum_game(quiz_id, user_id, max_players);
    }

    async join(game: Games, user: any, data: any, socket: Socket) {

        if (!this.io) {
            throw new SocketError('Socket.IO server instance is required for scrum controller');
        }

        // Verifying if user has already joined
        const alreadyJoined = await is_scrum_player(game.game_id, user.user_id);

        if (alreadyJoined) {
            throw new SocketError('You have already joined this game.');
        }

        // Make sure the game is not full
        if (game.max_players && (await count_players_in_game(game.game_id)) >= game.max_players) {
            throw new SocketError('Scrum game is full.');
        }


        await add_player_to_scrum_game(game.game_id, user.user_id);


        const players = await get_players_in_game(game.game_id);

        const playerList: string[] = [];

        if (players && players.teams.length > 0) {
            players.teams.forEach(teams => {
                teams.players.forEach(player => {
                    playerList.push(player.username);
                });
            });
        }

        socket.join(game.game_id);

        // Notify other players that a player joined
        this.io.to(game.game_id).emit('playerJoined', { playerList });

        return { message: 'Scrum game successfully joined.' };
    }


    async start(game: Games) {
        if (!this.io) {
            throw new SocketError('Socket.IO server instance is required for scrum controller');
        }

        if (!game.max_players) {
            throw new SocketError('The maximum number of players must be defined in Scrum mode.');
        }

        const currentPlayers = await count_players_in_game(game.game_id);
        if (currentPlayers < game.max_players) {
            throw new SocketError(`The number of players was not reached. (${currentPlayers}/${game.max_players})`);
        }

        await update_game_status(game.game_id, 'started');

        return { message: 'Scrum game started.' };
    }




    async init_scrum_game(quiz_id: string, user_id: string, max_players: number) {
        const newGame = await persist_game(
            quiz_id,
            user_id,
            'scrum',
            null,
            max_players,
            'pending',
        );

        return newGame;
    }

    async game_informations(game: any, user_id: string): Promise<any> {
        const game_informations = await get_scrum_game_informations(game.game_id, user_id);

        return game_informations;
    }

    async switch_team(): Promise<void> {
        throw new SocketError('Switching teams is only available in team games.');
    }
}

