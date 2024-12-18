import { prisma } from "../db";

export async function persist_answer(
  gamesGame_id: string,
  questionsQuestion_id: string,
  optionsOption_id: string,
  usersUser_id: string | null
) {
  return await prisma.answers.create({
    data: {
      gamesGame_id,
      questionsQuestion_id,
      optionsOption_id,
      usersUser_id
    },
  });
}

// Singleplayer game modes
export async function count_correct_answers_singleplayer(gamesGame_id: string) {
  return await prisma.answers.count({
    where: {
      gamesGame_id: gamesGame_id,
      options: {
        is_correct_answer: true,
      },
    },
  });
}



// Multiplayers game modes
export async function count_correct_answers_multiplayer(gamesGame_id: string, user_id: string) {
  return await prisma.answers.count({
    where: {
      gamesGame_id: gamesGame_id,
      usersUser_id: user_id,
      options: {
        is_correct_answer: true,
      },
    },
  });
}





export async function get_correct_answers(gamesGame_id: string) {
  return await prisma.answers.findMany({
    where: {
      gamesGame_id,
      options: {
        is_correct_answer: true,
      },
    },
    include: {
      options: true,
      questions: true,
    },
  });
}


export async function get_user_answer(gamesGame_id: string, questionsQuestion_id: string, user_id: string) {
  return await prisma.answers.findFirst({
    where: {
      gamesGame_id,
      questionsQuestion_id,
      usersUser_id: user_id,
    },
    include: {
      options: true,
    },
  });
}

