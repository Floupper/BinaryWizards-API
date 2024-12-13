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
                    res.status(401).json({ error: 'Authentication required to access this game' });
                    return;
                }
                if (game.userUser_id !== user.user_id) {
                    res.status(403).json({ error: 'You are not authorized to access this game' });
                    return;
                }
                break;

            case 'scrum':
                if (!user) {
                    res.status(401).json({ error: 'Authentication required to access this game' });
                    return;
                }

                // Verifying if player is in the scrum game
                const isScrumPlayer = await is_scrum_player(game.game_id, user.user_id);

                if (!isScrumPlayer) {
                    res.status(403).json({ error: 'You have not joined this Scrum game' });
                    return;
                }
                break;

            case 'team':
                if (!user) {
                    res.status(401).json({ error: 'Authentication required to access this game' });
                    return;
                }

                const isTeamPlayer = await is_team_player(game.game_id, user.user_id);

                if (!isTeamPlayer) {
                    res.status(403).json({ error: 'You are not part of any team in this game' });
                    return;
                }
                break;

            default:
                res.status(400).json({ error: 'Invalid game mode' });
                return;
        }

        req.game = game;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}