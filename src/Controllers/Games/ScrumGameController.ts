import { Server } from 'socket.io';
import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { add_player_to_scrum_game, count_players_in_game, get_players_in_game, is_scrum_player, persist_game, update_game_status } from '../../Repositories/gamesRepository';
import { SocketError } from '../../Sockets/SocketError';

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

    async join(game: any, user: any, data: any) {

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

        // Automatically start the game if the game is already full
        if (game.max_players && (await count_players_in_game(game.game_id)) >= game.max_players) {
            await update_game_status(game.game_id, 'started');
            // TODO: automatically start the game
        }


        const players = await get_players_in_game(game.game_id);

        const playerList: string[] = [];

        players.forEach(game => {
            game.teams.forEach(team => {
                team.players.forEach(player => {
                    playerList.push(player.username);
                });
            });
        });

        // Notify other players that a player joined
        this.io.to(game.game_id).emit('playerJoined', { playerList });

        return { message: 'Scrum game successfully joined.' };
    }


    async start(game: any) {
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

        // Adding creator to the game
        await add_player_to_scrum_game(newGame.game_id, user_id!);

        return newGame;
    }
}

