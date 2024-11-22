import { prisma } from "../db";
import { generate_quiz_id } from "../Helpers/quizzesHelper";


export async function persist_quiz(difficulty: string, title: string, is_public: boolean, user_id: string | null) {
    return await prisma.quizzes.create({
        data: {
            quiz_id: await generate_quiz_id(),
            difficulty: difficulty,
            title: title,
            is_public: is_public,
            userUser_id: user_id,
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

export async function quiz_id_exists(quiz_id: string) {
    return await prisma.quizzes.count({ where: { quiz_id } }) > 0;
}


export async function get_quiz_informations(quiz_id: string) {
    return await prisma.quizzes.findUnique({
        where: { quiz_id },
        select: {
            title: true,
            difficulty: true,
            is_public: true,
            questions: {
                orderBy: {
                    question_index: 'asc'
                },
                select: {
                    question_id: true,
                    question_index: true,
                    question_text: true,
                    question_difficulty: true,
                    question_category: true,
                },
            },
        },
    });
}


export async function get_user_quizzes(user_id: string) {
    return await prisma.quizzes.findMany({
        where: {
            userUser_id: user_id
        },
        include: {
            questions: {
                include: {
                    answers: true
                }
            },
            games: true
        }
    });
}

export async function find_quizzes_by_title(title: string, skip: number, limit: number) {
    return await prisma.quizzes.findMany({
        where: {
            is_public: true,
            title: {
                contains: title,
            },
        },
        select: {
            quiz_id: true,
            title: true,
            difficulty: true,
            created_at: true,
            questions: {
                select: {
                    question_id: true,
                },
            },
        },
        skip: skip,
        take: limit,
    });
}


export async function update_quiz(quiz_id: string, updateData: any) {
    return await prisma.quizzes.update({
        where: { quiz_id },
        data: updateData
    });
}