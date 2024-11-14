import { prisma } from "../db";


export async function persist_quiz(difficulty: string, title: string) {
    return await prisma.quizzes.create({
        data: {
            difficulty: difficulty,
            title: title
        },
    });
}




export async function get_quiz(quiz_id: string) {
    return await prisma.quizzes.findUnique({
        where: { quiz_id },
    });
}