import { prisma } from "../db";


export async function persist_quiz(category: number | undefined, difficulty: string | undefined, score: number, current_question_index: number) {
    return await prisma.quizzes.create({
        data: {
            category: category || 0,
            difficulty: difficulty || "Any",
            score,
            current_question_index,
        },
    });
}

export async function persist_quiz_update(quiz_id: string, score: number, current_question_index: number) {
    await prisma.quizzes.update({
        where: { quiz_id },
        data: {
            score,
            current_question_index,
        },
    });
}


export async function get_quiz(quiz_id: string) {
    return await prisma.quizzes.findUnique({
        where: { quiz_id },
    });
}