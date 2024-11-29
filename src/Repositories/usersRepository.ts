import { prisma } from "../db";

export async function get_user(username: string) {
    return await prisma.users.findUnique({
        where: { username },
    });
}


export async function create_user(username: string, password: string) {
    return await prisma.users.create({
        data: {
            username,
            password: password,
        },
        select: {
            user_id: true,
        },
    });
}


export async function get_games_by_user_paginated(user_id: string, skip: number, pageSize: number) {
    return await prisma.games.findMany({
        where: {
            userUser_id: user_id
        },
        include: {
            quizzes: true
        },
        skip: skip,
        take: pageSize,
    });
}

export async function get_games_by_user(user_id: string) {
    return await prisma.games.findMany({
        where: {
            userUser_id: user_id
        },
        include: {
            quizzes: true
        }
    });
}


export async function count_started_games_by_user(user_id: string) {
    return await prisma.games.count({
        where: {
            userUser_id: user_id
        }
    });
}