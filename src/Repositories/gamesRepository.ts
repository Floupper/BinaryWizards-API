import { prisma } from "../db";
import { generate_game_id } from "../Helpers/gamesHelper";
import { find_team } from "./teamsRepository";



export async function get_game(game_id: string) {
    return await prisma.games.findUnique({
        where: { game_id },
    });
}

export async function persist_game_update(game_id: string, updateData: Partial<{
    current_question_index: number;
    question_start_time: string | null;
}>) {
    await prisma.games.update({
        where: { game_id },
        data: updateData,
    });
}


export async function persist_game(quiz_id: string, user_id: string | null, mode: string, difficulty_level: string | null, max_players: number | null, status: string) {
    return await prisma.games.create({
        data: {
            game_id: await generate_game_id(),
            quizzesQuiz_id: quiz_id,
            current_question_index: 0,
            userUser_id: user_id,
            mode: mode,
            difficulty_level: difficulty_level,
            max_players: max_players,
            status: status
        },
    })
};


export async function game_id_exists(game_id: string) {
    return await prisma.games.count({ where: { game_id } }) > 0;
}


export async function count_players_in_game(game_id: string): Promise<number> {
    const game = await prisma.games.findUnique({
        where: { game_id },
        include: {
            teams: {
                include: {
                    players: true,
                },
            },
        },
    });

    if (!game) return 0;

    if (game.mode === 'scrum') {
        return await prisma.users.count({
            where: {
                teams: {
                    some: {
                        team_id: {
                            in: game.teams.map(team => team.team_id)
                        }
                    }
                }
            }
        });
    } else if (game.mode === 'team') {
        let count = 0;
        for (const team of game.teams) {
            count += team.players.length;
        }
        return count;
    } else {
        return await prisma.games.findUnique({
            where: { game_id },
            select: { userUser_id: true },
        }).then(game => (game?.userUser_id ? 1 : 0));
    }
}

export async function get_teams_in_game(game_id: string) {
    return await prisma.teams.findMany({
        where: { gamesGame_id: game_id },
    });
}


export async function update_game_status(game_id: string, status: string) {
    return await prisma.games.update({
        where: { game_id },
        data: { status },
    });
}


export async function add_player_to_scrum_game(game_id: string, user_id: string) {
    // We put the player in a solo team for Scrum mode
    await prisma.teams.create({
        data: {
            name: `Player_${user_id}`,
            gamesGame_id: game_id,
            players: {
                connect: { user_id },
            },
        },
    });
}


export async function is_scrum_player(game_id: string, user_id: string) {
    return await prisma.teams.findFirst({
        where: {
            gamesGame_id: game_id,
            players: {
                some: { user_id: user_id },
            },
        },
    });
}


export async function is_team_player(game_id: string, user_id: string) {
    return await prisma.teams.findFirst({
        where: {
            gamesGame_id: game_id,
            players: {
                some: { user_id: user_id },
            },
        },
    });
}