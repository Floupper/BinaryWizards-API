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


export async function user_team_in_game(gamesGame_id: string, user_id: string | null) {
    return await prisma.teams.findFirst({
        where: {
            gamesGame_id: gamesGame_id,
            players: {
                some: { user_id: user_id ?? undefined },
            },
        },
    });
}


export async function get_teams_for_game(game_id: string) {
    return await prisma.teams.findMany({
        where: { gamesGame_id: game_id },
        select: {
            team_id: true,
            name: true,
            players: {
                select: {
                    user_id: true,
                    username: true,
                },
            },
        },
    });
}


export async function remove_player_from_team(team_id: string, user_id: string) {
    await prisma.teams.update({
        where: { team_id: team_id },
        data: {
            players: {
                disconnect: { user_id },
            },
        },
    });
}


export async function get_team_from_game(game_id: string, user_id: string) {
    return await prisma.teams.findFirst({
        where: {
            gamesGame_id: game_id,
            players: {
                some: { user_id: user_id }
            }
        }
    });
}