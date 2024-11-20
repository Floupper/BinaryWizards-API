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