import { Request, Response } from 'express';
import { get_quiz } from '../Repositories/quizzesRepository';
import { count_started_games_by_user, get_started_games_by_user_paginated } from '../Repositories/usersRepository';
import { get_total_questions_count } from '../Helpers/questionsHelper';
import { assert } from 'superstruct';
import { GameInitData } from '../Validation/game';
import { add_player_to_scrum_game, count_players_in_game, get_game, get_teams_in_game, update_game_status } from '../Repositories/gamesRepository';
import { generate_game_link } from '../Helpers/gamesHelper';
import { assign_player_to_team, find_team } from '../Repositories/teamsRepository';
import { GameControllerFactory } from '../Controllers/GameControllerFactory';


export async function init_one(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        assert(req.body, GameInitData);
    } catch (error) {
        res.status(400).json({ error: 'Invalid data received to init game' });
        return;
    }

    const { mode, ...initData } = req.body;

    try {
        const quiz = await get_quiz(quiz_id);

        if (!quiz) {
            res.status(404).json({ error: 'Quiz not found.' });
            return;
        }

        if (quiz.type !== 1) {
            res.status(403).json({ error: 'The quiz is not accessible.' });
            return;
        }

        const user_id = req.user?.user_id || null;

        const gameController = GameControllerFactory.getController(mode);

        const newGame = await gameController.init(quiz_id, user_id, initData);

        res.status(201).json({
            message: 'Game created',
            game_id: newGame.game_id,
            game_link: generate_game_link(newGame.game_id)
        });
    } catch (error: any) {
        // Specific errors handling
        if (error.message === 'Invalid mode') {
            res.status(400).json({ error: 'Invalid mode' });
            return;
        }
        if (error.message.includes('required')) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message.includes('authenticated')) {
            res.status(403).json({ error: error.message });
            return;
        }
        console.error('Error at game initialization :', error);


        res.status(500).json({ error: 'Internal server error in game initialization.' });
    }
}



export async function join_game(req: Request, res: Response) {
    const { game_id } = req.params;
    const user = req.user;
    const joinData = req.body; // Additional data like team_name

    try {
        if (!user) {
            // Could not happen because user is verified in middleware, added for ts errors
            res.status(403).json({ error: 'Authentication required to join a game.' });
            return;
        }

        const game = await get_game(game_id);

        if (!game) {
            res.status(404).json({ error: 'Game not found.' });
            return;
        }

        if (game.status !== 'pending') {
            res.status(400).json({ error: 'Impossible to join a started game.' });
            return;
        }

        const gameController = GameControllerFactory.getController(game.mode);

        const result = await gameController.join(game, user, joinData);

        res.status(200).json(result);
        return;
    } catch (error: any) {

        if (error.message === 'Invalid mode') {
            res.status(400).json({ error: 'Invalid game mode.' });
            return;
        }
        if (error.message.includes('required')) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message.includes('authenticated')) {
            res.status(403).json({ error: error.message });
            return;
        }
        if (error.message === 'Scrum game is full.') {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message === 'Game mode does not support the join game action.') {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message === 'Team not found for this game.') {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error.message === 'You have already joined this game.') {
            res.status(400).json({ error: error.message });
            return;
        }


        console.error('Error in join_game function :', error);

        res.status(500).json({ error: 'Internal server error in joining a game function.' });
        return;
    }
}


export async function start_one(req: Request, res: Response) {
    const { game_id } = req.params;
    const user = req.user;

    try {
        const game = await get_game(game_id);

        if (!game) {
            res.status(404).json({ error: 'Game not found.' });
            return;
        }

        if (game.userUser_id !== user?.user_id) {
            res.status(403).json({ error: 'You are not allowed to start this game.' });
            return;
        }

        if (game.status !== 'pending') {
            res.status(400).json({ error: 'Game can\'t be started in its current state.' });
            return;
        }

        const gameController = GameControllerFactory.getController(game.mode);

        const result = await gameController.start(game, user);

        res.status(200).json(result);
    } catch (error: any) {

        if (error.message === 'Invalid mode') {
            res.status(400).json({ error: 'Invalid game mode.' });
            return;
        }
        if (error.message.includes('required')) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.message.includes('allowed')) {
            res.status(403).json({ error: error.message });
            return;
        }
        if (error.message.includes('players')) {
            res.status(400).json({ error: error.message });
            return;
        }


        console.error('Error while starting game:', error);

        res.status(500).json({ error: 'Internal server error while starting game.' });
    }
}


export async function get_started_by_user(req: Request, res: Response): Promise<void> {
    const user = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;
    try {
        if (user) { // user is already authenticated (verified in middleware), condition for ts errors
            const total_games = Number((await count_started_games_by_user(user.user_id))[0]?.total ?? 0);
            const started_games = await get_started_games_by_user_paginated(user.user_id, skip, pageSize);

            const unfinished_games = await Promise.all(
                started_games.map(async (game) => {
                    const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
                    if (game.current_question_index < nb_questions_total) {
                        return { ...game, nb_questions_total };
                    }
                    return null;
                })
            );


            const response: any = {
                pageSize: pageSize,
                unfinished_games: unfinished_games,
                total_games: total_games
            };
            const totalPages = Math.ceil(total_games / pageSize);
            if (page < totalPages) {
                response.nextPage = page + 1;
            }

            res.status(200).json(response);
        }
    } catch (error) {
        console.error('Error fetching started games:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}