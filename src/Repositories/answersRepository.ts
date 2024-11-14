import { prisma } from '../db'

export async function persist_answer(gamesGame_id: string, questionsQuestion_id: string, optionsOption_id: string) {
    return await prisma.answers.create({
        data: {
            gamesGame_id,
            questionsQuestion_id,
            optionsOption_id,
        },
    });
}

export async function count_correct_answers(gamesGame_id: string): Promise<number> {
    const correctAnswersCount = await prisma.answers.count({
        where: {
            gamesGame_id,
            options: {
                is_correct_answer: true,
            },
        },
    });
    return correctAnswersCount;
}


export async function get_correct_answers(gamesGame_id: string) {
    return await prisma.answers.findMany({
        where: {
            gamesGame_id,
            options: {
                is_correct_answer: true
            }
        },
        include: {
            options: true,
            questions: true
        }
    });
}


