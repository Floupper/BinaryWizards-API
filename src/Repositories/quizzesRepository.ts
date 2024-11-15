import { prisma } from "../db";
import { generate_quiz_id } from "../Helpers/quizzesHelper";


export async function persist_quiz(difficulty: string, title: string) {
    return await prisma.quizzes.create({
        data: {
            quiz_id: generate_quiz_id(),
            difficulty: difficulty,
            title: title,
            is_public: true //TODO: make this configurable
        },
    });
}

export async function get_quiz(quiz_id: string) {
    return await prisma.quizzes.findUnique({
        where: { quiz_id },
    });
}

export async function get_public_quiz(quiz_id: string) {
    return await prisma.quizzes.findUnique({
        where: { quiz_id },
        select: { is_public: true },
    });
}