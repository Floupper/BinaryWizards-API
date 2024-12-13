import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { get_teams_in_game, is_team_player, persist_game, update_game_status } from '../../Repositories/gamesRepository';
import { assign_player_to_team, find_team } from '../../Repositories/teamsRepository';

export class TeamGameController implements GameControllerInterface {
    async init(quiz_id: string, user_id: string | null, data: any) {
        const { difficulty_level } = data;
        if (!user_id) {
            throw new Error('You have to be authenticated to create a Team game.');
        }
        if (!difficulty_level) {
            throw new Error('difficulty_level is required for team mode');
        }
        return await this.init_team_game(quiz_id, user_id, difficulty_level);
    }

    async join(game: any, user: any, data: any) {

        // Verifying if user has already joined
        const alreadyJoined = await is_team_player(game.game_id, user.user_id);

        const { team_name } = data;

        if (!team_name) {
            throw new Error('The Team name is required to join a game with Team mode.');
        }

        if (alreadyJoined) {
            throw new Error('You have already joined this game.');
        }

        const team = await find_team(game.game_id, team_name);

        if (!team) {
            throw new Error('Team not found for this game.');
        }

        await assign_player_to_team(team.team_id, user.user_id);

        return { message: `Game successfully joined in team "${team_name}".` };
    }

    async start(game: any, user: any) {
        const teams = await get_teams_in_game(game.game_id);
        if (teams.length < 2) {
            throw new Error('At least 2 teams are needed for Team mode.');
        }

        await update_game_status(game.game_id, 'started');
        return { message: 'Team game started.' };
    }




    async init_team_game(quiz_id: string, user_id: string | null, difficulty_level: string) {
        const newGame = await persist_game(
            quiz_id,
            user_id,
            'team',
            difficulty_level,
            null,
            'pending',
        );

        return newGame;
    }
}