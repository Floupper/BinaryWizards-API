import { prisma } from '../db'

export async function persist_answer(quizzesQuiz_id: string, questionsQuestion_id: string, optionsOption_id: string, gamesGame_id: string) {
    return await prisma.answers.create({
        data: {
            quizzesQuiz_id,
            questionsQuestion_id,
            optionsOption_id,
            gamesGame_id
        },
    });
}

export async function count_correct_answers(quiz_id: string): Promise<number> {
    const correctAnswersCount = await prisma.answers.count({
        where: {
            quizzesQuiz_id: quiz_id,
            Options: {
                is_correct_answer: true,
            },
        },
    });
    return correctAnswersCount;
}


export async function get_correct_answers(quiz_id: string) {
    return await prisma.answers.findMany({
        where: {
            quizzesQuiz_id: quiz_id,
            Options: {
                is_correct_answer: true
            }
        },
        include: {
            Options: true,
            Questions: true
        }
    });
}


