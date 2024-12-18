import { count_correct_answers_multiplayer, count_correct_answers_singleplayer, get_correct_answers } from "../Repositories/answersRepository";
import { user_team_in_game } from "../Repositories/teamsRepository";


export async function get_correct_answers_count(game_id: string, user_id?: string | null): Promise<number> {
    if (!user_id) {
        // singleplayer
        return await count_correct_answers_singleplayer(game_id);
    } else {
        // multiplayer
        const user_team = await user_team_in_game(game_id, user_id);

        if (!user_team) {
            throw new Error("User is not in the game");
        }

        return await count_correct_answers_multiplayer(game_id, user_id);
    }
}