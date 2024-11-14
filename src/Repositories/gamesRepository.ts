import { prisma } from "../db";



export async function get_game(game_id: string) {
    return await prisma.games.findUnique({
        where: { game_id },
    });
}

export async function persist_game_update(game_id: string, current_question_index: number) {
    await prisma.games.update({
        where: { game_id },
        data: {
            current_question_index,
        },
    });
}