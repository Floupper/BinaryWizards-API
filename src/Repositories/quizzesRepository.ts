import { prisma } from "../db";
import { generate_quiz_id } from "../Helpers/quizzesHelper";


export async function persist_quiz(difficulty: string, title: string, type: number, user_id: string | null, description: string) {
    return await prisma.quizzes.create({
        data: {
            quiz_id: await generate_quiz_id(),
            difficulty: difficulty,
            title: title,
            description: description,
            type: type,
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
        select: { type: true },
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
            description: true,
            difficulty: true,
            type: true,
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
            userUser_id: user_id,
            type: {
                not: 2,
            }
        }
    });
}


export async function get_user_quiz(user_id: string, quiz_id: string) {
    return await prisma.quizzes.findFirst({
        where: {
            userUser_id: user_id,
            quiz_id: quiz_id,
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

export async function find_quizzes_with_filters(searchTerm: string, skip: number, limit: number, difficulty?: string, minQuestions: number = 0, maxQuestions: number = Infinity) {
    return await prisma.quizzes.findMany({
        where: {
            type: 1,
            OR: [
                {
                    title: {
                        contains: searchTerm,
                    },
                },
                {
                    description: {
                        contains: searchTerm,
                    },
                }
            ],
            ...(difficulty ? { difficulty: { equals: difficulty } } : {}),
        },
        include: {
            _count: {
                select: {
                    questions: true
                }
            },
            questions: {
                select: {
                    question_id: true,
                },
            },
        },
        skip: skip,
        take: limit,
        orderBy: {
            created_at: 'desc',
        }
    }).then(quizzes =>
        quizzes.filter(quiz =>
            quiz._count.questions >= minQuestions && quiz._count.questions <= maxQuestions
        )
    );
}


export async function count_quizzes_with_filters(searchTerm: string, difficulty?: string, minQuestions: number = 0, maxQuestions: number = Infinity) {
    const quizzes = await prisma.quizzes.findMany({
        where: {
            type: 1,
            OR: [
                {
                    title: {
                        contains: searchTerm
                    },
                },
                {
                    description: {
                        contains: searchTerm
                    },
                }
            ],
            ...(difficulty ? { difficulty: { equals: difficulty } } : {}),
        },
        include: {
            _count: {
                select: {
                    questions: true
                }
            },
            questions: {
                select: {
                    question_id: true,
                },
            },
        },
        orderBy: {
            created_at: 'desc',
        }
    });

    return quizzes.filter(quiz =>
        quiz._count.questions >= minQuestions && quiz._count.questions <= maxQuestions
    ).length;
}


export async function update_quiz(quiz_id: string, updateData: any) {
    return await prisma.quizzes.update({
        where: { quiz_id },
        data: updateData
    });
}