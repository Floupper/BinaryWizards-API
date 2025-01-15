import { count_answers_for_question, get_answers_in_game } from "../Repositories/answersRepository";
import { count_players_in_game, game_id_exists, get_teams_in_game, get_teams_players_in_game } from "../Repositories/gamesRepository";
import { get_teams_for_game } from "../Repositories/teamsRepository";
import { NANOID } from "./nanoidsHelper";
import { get_total_questions_count } from "./questionsHelper";


export async function generate_game_id() {
    let quiz_id = `GA${NANOID()}`;
    while (await game_id_exists(quiz_id)) {
        quiz_id = `GA${NANOID()}`;
    }
    return `GA${NANOID()}`;
}

export function generate_game_link(game_id: string): string {
    return `/game/join/${game_id}`;
}

export async function get_teams_scores(game_id: string, quiz_id: string) {
    const teams = await get_teams_for_game(game_id);

    const playerScores = await get_players_scores(game_id);

    const teamScores: {
        [key: string]: {
            average_score: number;
            total_score: number;
            members: {
                username: string;
                score: number;
            }[];
        }
    } = {};

    teams.forEach(team => {
        teamScores[team.name] = {
            average_score: 0,
            total_score: 0,
            members: []
        };
    });

    for (const team of teams) {
        const teamMembers = team.players || [];

        for (const member of teamMembers) {
            const playerScore = playerScores[member.user_id];
            if (playerScore) {
                teamScores[team.name].total_score += playerScore.correct;
                teamScores[team.name].members.push({
                    username: playerScore.username,
                    score: playerScore.correct
                });
            }
        }

        teamScores[team.name].average_score = teamScores[team.name].total_score / teamScores[team.name].members.length;
    }

    return teamScores;

}


export async function get_scrum_scores(game_id: string) {
    const player_scores = await get_players_scores(game_id);

    const scores_array = Object.entries(player_scores).map(([_, playerData]) => ({
        username: playerData.username,
        score: playerData.correct
    }));

    const sorted_scores = scores_array.sort((a, b) => b.score - a.score);

    return sorted_scores;
}

export async function get_players_scores(game_id: string) {
    // Retrieve all players scores
    const answers = await get_answers_in_game(game_id);

    // Calculate each player's score
    const player_scores: {
        [key: string]: {
            correct: number;
            username: string;
        }
    } = {};

    answers.forEach(answer => {
        if (answer.usersUser_id) {
            if (!player_scores[answer.usersUser_id]) {
                player_scores[answer.usersUser_id] = {
                    correct: 0,
                    username: answer.Users?.username ?? ""
                };
            }
            if (answer.options.is_correct_answer) {
                player_scores[answer.usersUser_id].correct++;
            }
        }
    });

    return player_scores;
}


export async function have_all_scrum_players_answered(game_id: string, question_id: string) {
    return await count_players_in_game(game_id) == await count_answers_for_question(game_id, question_id);
}