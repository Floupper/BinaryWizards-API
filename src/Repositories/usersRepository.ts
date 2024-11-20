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