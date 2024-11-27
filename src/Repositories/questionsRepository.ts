import { prisma } from '../db'


export async function get_current_question(quiz_id: string, question_index: number) {
    return await prisma.questions.findFirst({
        where: {
            quizzesQuiz_id: quiz_id,
            question_index: question_index,
        },
        include: {
            options: true,
        },
    });
}

export async function persist_question(question_index: number, question_text: string, question_category: string, question_difficulty: string, question_type: string, quizzesQuiz_id: string) {
    return await prisma.questions.create({
        data: {
            question_index,
            question_text,
            question_category,
            question_difficulty,
            question_type,
            quizzesQuiz_id,
        },
    });
}


export async function update_question(question_id: string, question_index: number, question_text: string, question_category: string, question_difficulty: string, question_type: string, quizzesQuiz_id: string) {
    return await prisma.questions.update({
        where: { question_id },
        data: {
            question_index,
            question_text,
            question_category,
            question_difficulty,
            question_type,
            quizzesQuiz_id,
        },
    });
}


export async function get_all_questions(quizzesQuiz_id: string) {
    return await prisma.questions.findMany({
        where: { quizzesQuiz_id },
    });
}

export async function get_total_questions(quiz_id: string) {
    return await prisma.questions.count({
        where: { quizzesQuiz_id: quiz_id },
    });
}



export async function get_question_informations(question_id: string) {
    return await prisma.questions.findUnique({
        where: { question_id },
        select: {
            question_id: true,
            question_index: true,
            question_text: true,
            question_difficulty: true,
            question_category: true,
            question_type: true,
            quizzesQuiz_id: true,
            options: {
                select: {
                    option_text: true,
                    option_index: true,
                    is_correct_answer: true,
                },
            },
        },
    });
}


export async function delete_question(question_id: string) {
    return await prisma.questions.delete({
        where: { question_id },
    });
}


export async function get_user_question(question_id: string) {
    return await prisma.questions.findUnique({
        where: {
            question_id: question_id,
        },
        include: {
            options: {
                select: {
                    option_id: true,
                    option_text: true,
                    option_index: true,
                    is_correct_answer: true
                }
            },
            answers: {
                select: {
                    answer_id: true,
                    gamesGame_id: true,
                    options: {
                        select: {
                            option_id: true,
                            option_text: true,
                            is_correct_answer: true
                        }
                    }
                }
            }
        }
    });
}