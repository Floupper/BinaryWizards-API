import { prisma } from "../db";

export async function get_user(username: string) {
    return await prisma.users.findUnique({
        where: { username },
    });
}


export async function create_user(username: string, password: string) {
    return await prisma.users.create({
        data: {
            username,
            password: password,
        },
        select: {
            user_id: true,
        },
    });
}


export async function get_games_by_user_paginated(user_id: string, skip: number, pageSize: number) {
    return await prisma.games.findMany({
        where: {
            userUser_id: user_id
        },
        include: {
            quizzes: true
        },
        skip: skip,
        take: pageSize,
    });
}




export async function get_games_by_user(user_id: string) {
    return await prisma.games.findMany({
        where: {
            OR: [
                {
                    userUser_id: user_id
                },
                {
                    teams: {
                        some: {
                            players: {
                                some: {
                                    user_id: user_id
                                }
                            }
                        }
                    }
                }
            ]
        },
        include: {
            quizzes: true
        }
    });
}
export async function count_started_games_by_user(user_id: string) {
    return await prisma.$queryRaw<
        { total: bigint }[]
    >`SELECT COUNT(*) AS total FROM (
    SELECT Games.game_id
    FROM Games
    JOIN Quizzes ON Games.quizzesQuiz_id = Quizzes.quiz_id
    JOIN Questions ON Quizzes.quiz_id = Questions.quizzesQuiz_id
    WHERE Games."userUser_id" = ${user_id}
    AND (Games.mode = 'standard' OR Games.mode = 'time')
    GROUP BY Games.game_id
    HAVING Games.current_question_index < COUNT(Questions.question_id)
) AS sub;`;
}


export async function get_started_games_by_user_paginated(user_id: string, skip: number, pageSize: number) {
    return await prisma.$queryRaw<
        any[]
    >`SELECT Games.*, Quizzes.*, COUNT(Questions.question_id) AS nb_questions_total
  FROM Games
  JOIN Quizzes ON Games.quizzesQuiz_id = Quizzes.quiz_id
  JOIN Questions ON Quizzes.quiz_id = Questions.quizzesQuiz_id
  WHERE Games."userUser_id" = ${user_id}
  AND (Games.mode = 'standard' OR Games.mode = 'time')
  GROUP BY Games.game_id, Quizzes.quiz_id
  HAVING Games.current_question_index < COUNT(Questions.question_id)
  ORDER BY Games.created_at DESC
  LIMIT ${pageSize} OFFSET ${skip};`
}


export async function get_user_multiplayer_games(user_id: string) {
    return await prisma.games.findMany({
        where: {
            mode: {
                in: ['scrum', 'team'],
            },
            teams: {
                some: {
                    players: {
                        some: {
                            user_id: user_id,
                        },
                    },
                },
            },
        },
        include: {
            quizzes: {
                select: {
                    _count: {
                        select: { questions: true }
                    }
                }
            }
        },
    });
}


export async function count_quizzes_from_user(user_id: string) {
    return await prisma.quizzes.count({
        where: {
            userUser_id: user_id,
        },
    });
}