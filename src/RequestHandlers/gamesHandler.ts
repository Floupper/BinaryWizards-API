import { Request, Response } from 'express';
import { get_quiz } from '../Repositories/quizzesRepository';
import { count_started_games_by_user, get_started_games_by_user_paginated } from '../Repositories/usersRepository';
import { get_total_questions_count } from '../Helpers/questionsHelper';
import { assert } from 'superstruct';
import { GameInitData } from '../Validation/game';
import { add_player_to_scrum_game, count_players_in_game, get_game, get_teams_in_game, update_game_status } from '../Repositories/gamesRepository';
import { generate_game_id, generate_game_link } from '../Helpers/gamesHelper';
import { assign_player_to_team, find_team } from '../Repositories/teamsRepository';
import { init_stadard_game } from '../Controllers/Modes/standardGameController';
import { init_team_game } from '../Controllers/Modes/teamGameController';
import { init_scrum_game } from '../Controllers/Modes/scrumGameController';


export async function init_one(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        assert(req.body, GameInitData);
    } catch (error) {
        res.status(400).json({ error: 'Invalid data received to init game', });
        return
    }

    const { mode, difficulty_level, max_players } = req.body;

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

        let newGame;

        switch (mode) {
            case 'standard':
                newGame = await init_stadard_game(quiz_id, user_id);
                break;
            case 'time':
                if (!difficulty_level) {
                    res.status(400).json({ error: 'difficulty_level is required for time mode' });
                    return;
                }
                newGame = await init_team_game(quiz_id, user_id, difficulty_level);
                break;
            case 'scrum':
                if (!user_id) {
                    res.status(403).json({ error: 'You have to be authenticated to create a Scrum game.' });
                    return;
                }
                if (!max_players) {
                    res.status(400).json({ error: 'max_players is required for scrum mode' });
                    return;
                }
                newGame = await init_scrum_game(quiz_id, user_id, max_players);
                break;
            case 'team':
                if (!user_id) {
                    res.status(403).json({ error: 'You have to be authenticated to create a Team game.' });
                    return;
                }
                if (!difficulty_level) {
                    res.status(400).json({ error: 'difficulty_level is required for team mode' });
                    return;
                }
                newGame = await init_team_game(quiz_id, user_id, difficulty_level);
                break;
            default:
                res.status(400).json({ error: 'Invalid mode' });
                return;
        }

        res.status(201).json({ message: 'Game created', game_id: newGame.game_id, game_link: generate_game_link(newGame.game_id) });
        return;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la partie :', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
        return;
    }
}


export async function start_one(req: Request, res: Response) {
    const { game_id } = req.params;

    try {
        // Récupérer la partie depuis la base de données
        const game = await get_game(game_id);

        if (!game) {
            res.status(404).json({ error: 'Game not found.' });
            return;
        }

        // Verifiyng that the request is from game owner
        if (game.userUser_id !== req.user?.user_id) {
            res.status(403).json({ error: 'You are not allowed to start this game.' });
            return;
        }

        // Verifiyng that the game is in pending state
        if (game.status !== 'pending') {
            res.status(400).json({ error: 'Game can\'t be started in his actual state.' });
            return;
        }

        // Verifiation on specific informations about game mode
        switch (game.mode) {
            case 'standard':
                break;
            case 'time':
                if (!game.difficulty_level) {
                    res.status(400).json({ error: 'The difficulty level have to be defined in Team mode.' });
                    return;
                }
                break;
            case 'scrum':
                if (!game.max_players) {
                    res.status(400).json({ error: 'The maximum number of player have to be defined in Scrum mode.' });
                    return;
                }
                // Verifying that the number of players is correct
                const currentPlayers = await count_players_in_game(game_id);
                if (currentPlayers < game.max_players) {
                    res.status(400).json({ error: `The number of players was not reached. (${currentPlayers}/${game.max_players})` });
                    return;
                }
                break;
            case 'team':
                // Verifying that at least two teams are in the game
                const teams = await get_teams_in_game(game_id);
                if (teams.length < 2) {
                    res.status(400).json({ error: 'At least 2 teams are needed for Team mode.' });
                    return;
                }
                break;
            default:
                res.status(400).json({ error: 'Invalid game mode.' });
                return;
        }

        await update_game_status(game_id, 'started');

        res.status(200).json({ message: 'Game started.' });
        return;
    } catch (error) {
        console.error('Error while starting game :', error);
        res.status(500).json({ error: 'Internal server error while starting game.' });
        return;
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



export async function join_game(req: Request, res: Response) {
    const { game_id } = req.params;
    const user = req.user;

    try {
        if (user) { // user is already authenticated (verified in middleware), condition for ts errors
            const game = await get_game(game_id);

            if (!game) {
                res.status(404).json({ error: 'Game not found.' });
                return;
            }

            if (game.status !== 'pending') {
                res.status(400).json({ error: 'Impossible to join a started game.' });
                return;
            }

            switch (game.mode) {
                case 'scrum':
                    // Verifying that the number of players has not reached the maximum
                    if (game.max_players && (await count_players_in_game(game_id)) >= game.max_players) {
                        res.status(400).json({ error: 'Scrum game is full.' });
                        return;
                    }

                    await add_player_to_scrum_game(game_id, user.user_id);

                    // Verifying if the maximum number of players is reached to automatically start the game
                    if (game.max_players && (await count_players_in_game(game_id)) >= game.max_players) {
                        await update_game_status(game_id, 'started');

                        // TODO: start automatically the game when all players are in the game
                    }

                    res.status(200).json({ message: 'Scrum game successfully joined.' });
                    return;

                case 'team':
                    const { team_name } = req.body;

                    if (!team_name) {
                        res.status(400).json({ error: 'The Team name is required to join a game with Team mode.' });
                        return;
                    }
                    const team = await find_team(game_id, team_name);

                    if (!team) {
                        res.status(404).json({ error: 'Team not found for this game.' });
                        return;
                    }
                    await assign_player_to_team(team.team_id, user.user_id);

                    res.status(200).json({ message: `Game successfully joined in team "${team_name}".` });
                    return;

                case 'standard':
                case 'time':
                    res.status(400).json({ error: `The game mode ${game.mode} does not support the join game action.` });
                    return;

                default:
                    res.status(400).json({ error: 'Invalid game mode.' });
                    return;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la jonction de la partie :', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
        return;
    }
}