import { Server, Socket } from 'socket.io';
import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { get_players_in_game, get_team_game_informations, get_teams_players_in_game, is_team_player, persist_game, remove_player, update_game_status } from '../../Repositories/gamesRepository';
import { assign_player_to_team, find_team, get_team_from_game, get_teams_for_game, init_team_for_game, remove_player_from_team } from '../../Repositories/teamsRepository';
import { Games } from '@prisma/client';
import { SocketError } from '../../Sockets/SocketError';

export class TeamGameController implements GameControllerInterface {
    private io: Server | null;

    constructor(io: Server | null) {
        this.io = io;
    }

    async init(quiz_id: string, user_id: string | null, data: any) {
        const { difficulty_level, teams } = data;
        if (!user_id) {
            throw new SocketError('You have to be authenticated to create a Team game.');
        }
        if (!difficulty_level) {
            throw new SocketError('difficulty_level is required for team mode');
        }

        if (!teams) {
            throw new SocketError('teams is required for team mode');
        }
        return await this.init_team_game(quiz_id, user_id, difficulty_level, teams);
    }

    async join(game: Games, user: any, data: any, socket: Socket) {
        if (!this.io) {
            throw new SocketError('Socket.IO server instance is required for team controller');
        }
        // Check if the user has already joined
        const alreadyJoined = await is_team_player(game.game_id, user.user_id);

        const { team_name } = data;

        if (!team_name) {
            throw new SocketError('The Team name is required to join a game with Team mode.');
        }

        if (alreadyJoined) {
            throw new SocketError('You have already joined this game.');
        }

        const team = await find_team(game.game_id, team_name);

        if (!team) {
            throw new SocketError('Team not found for this game.');
        }

        await assign_player_to_team(team.team_id, user.user_id);


        const teams = (await get_teams_players_in_game(game.game_id));
        // Join the corresponding Socket.IO room for the game
        socket.join(game.game_id);

        // Notify the other players in the room that this player has joined
        this.io.to(game.game_id).emit('playerJoined', teams);

        return { message: `Game successfully joined in team "${team_name}".` };
    }

    async start(game: Games) {
        if (!this.io) {
            throw new SocketError('Socket.IO server instance is required for team controller');
        }

        if (game.status == 'started') {
            throw new SocketError('Game has already started.');
        }

        await update_game_status(game.game_id, 'started');

        // Notify the players that the game has started
        this.io.to(game.game_id).emit('gameStarted', { message: 'Team game started.' });

        return { message: 'Team game started.' };
    }

    private async init_team_game(quiz_id: string, user_id: string | null, difficulty_level: string, teams: string[]) {
        const newGame = await persist_game(
            quiz_id,
            user_id,
            'team',
            difficulty_level,
            null,
            'pending',
        );
        teams.map(async (team_name) => await init_team_for_game(newGame.game_id, team_name))

        return newGame;
    }


    async game_informations(game: any, user_id: string): Promise<any> {
        const game_informations = await get_team_game_informations(game.game_id, user_id);

        return game_informations;
    }

    async switch_team(game: Games, user_id: string, new_team_name: string): Promise<void> {
        if (!this.io) {
            throw new SocketError('Socket.IO server instance is required for team controller');
        }

        if (game.status !== 'pending') {
            throw new SocketError('Cannot switch team when game is not in pending status');
        }

        const new_team = await find_team(game.game_id, new_team_name);
        if (!new_team) {
            throw new SocketError('Team not found in this game');
        }

        const teams_for_game = await get_teams_for_game(game.game_id);
        const current_team = teams_for_game.find(team =>
            team.players.some(player => player.user_id === user_id)
        );

        if (current_team) {
            await remove_player_from_team(current_team.team_id, user_id);
        }

        await assign_player_to_team(new_team.team_id, user_id);

        const teams = (await get_teams_players_in_game(game.game_id));
        this.io.to(game.game_id).emit('teamSwitch', teams);
    }

    async leave_game(game_id: string, user_id: string): Promise<void> {
        const team = await get_team_from_game(game_id, user_id);
        if (!team) {
            throw new Error("User is not a player in this game");
        }

        await remove_player(team.team_id, user_id);
    }
}