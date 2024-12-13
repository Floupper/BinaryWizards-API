import { Request, Response, NextFunction } from 'express';
import { assert } from 'superstruct';
import { GAMEID } from '../Validation/game';
import { get_game, is_scrum_player, is_team_player } from '../Repositories/gamesRepository';

export function validateGameId(req: Request, res: Response, next: NextFunction) {
    const { game_id } = req.params;

    try {
        assert(game_id, GAMEID);
        next();
    } catch (error) {
        res.status(400).json({ error: 'The game id is invalid' });
    }
}


export async function checkGameAccess(req: Request, res: Response, next: NextFunction) {
    const { game_id } = req.params;
    const user = req.user;

    try {
        const game = await get_game(game_id);

        if (!game) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        switch (game.mode) {
            case 'standard':
            case 'time':
                if (!user) {
                    return res.status(401).json({ error: 'Authentication required to access this game' });
                }
                if (game.userUser_id !== user.user_id) {
                    return res.status(403).json({ error: 'You are not authorized to access this game' });
                }
                break;

            case 'scrum':
                if (!user) {
                    return res.status(401).json({ error: 'Authentication required to access this game' });
                }

                // Verifying if player is in the scrum game
                const isScrumPlayer = await is_scrum_player(game.game_id, user.user_id);

                if (!isScrumPlayer) {
                    return res.status(403).json({ error: 'You have not joined this Scrum game' });
                }
                break;

            case 'team':
                if (!user) {
                    return res.status(401).json({ error: 'Authentication required to access this game' });
                }

                const isTeamPlayer = await is_team_player(game.game_id, user.user_id);

                if (!isTeamPlayer) {
                    return res.status(403).json({ error: 'You are not part of any team in this game' });
                }
                break;

            default:
                return res.status(400).json({ error: 'Invalid game mode' });
        }

        req.game = game;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}