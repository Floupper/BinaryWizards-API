import { prisma } from "../db";


export async function find_team(game_id: string, team_name: string) {
    return await prisma.teams.findFirst({
        where: {
            gamesGame_id: game_id,
            name: team_name,
        },
    });
}

export async function assign_player_to_team(team_id: string, user_id: string) {
    await prisma.teams.update({
        where: { team_id: team_id },
        data: {
            players: {
                connect: { user_id },
            },
        },
    });
}


export async function init_team_for_game(game_id: string, team_name: string) {
    await prisma.teams.create({
        data: {
            name: team_name,
            gamesGame_id: game_id,
        },
    });
}