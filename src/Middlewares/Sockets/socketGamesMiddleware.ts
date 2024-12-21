import { Server, Socket } from 'socket.io';
import { get_game, is_scrum_player, is_team_player } from '../../Repositories/gamesRepository';
import { assert } from 'superstruct';
import { GAMEID } from '../../Validation/game';
import { SocketError } from '../../Sockets/SocketError';

export async function socketValidateGameId(game_id: string): Promise<void> {
    try {
        assert(game_id, GAMEID);
    } catch (error) {
        throw new Error('The game id is invalid');
    }
}

export async function socketCheckGameAccess(game_id: string, user: any | null, isJoinEvent: boolean): Promise<any> {
    const game = await get_game(game_id);

    if (!game) {
        throw new SocketError('Game not found');
    }
    if (!user) {
        throw new SocketError('Authentication required to access this game');
    }

    switch (game.mode) {
        case 'scrum':
            if (!isJoinEvent) {
                const isScrumPlayer = await is_scrum_player(game.game_id, user.user_id);

                if (!isScrumPlayer) {
                    throw new SocketError('You have not joined this Scrum game');
                }
            }
            break;

        case 'team':
            if (!isJoinEvent) {
                const isTeamPlayer = await is_team_player(game.game_id, user.user_id);

                if (!isTeamPlayer) {
                    throw new SocketError('You are not part of any team in this game');
                }
            }
            break;

        default:
            throw new SocketError('Invalid game mode');
    }

    return game;
}
