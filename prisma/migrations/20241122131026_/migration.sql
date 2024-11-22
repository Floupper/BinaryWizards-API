-- CreateTable
CREATE TABLE "Quizzes" (
    "quiz_id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userUser_id" TEXT,
    CONSTRAINT "Quizzes_userUser_id_fkey" FOREIGN KEY ("userUser_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Questions" (
    "question_id" TEXT NOT NULL PRIMARY KEY,
    "question_index" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_category" TEXT NOT NULL,
    "question_difficulty" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "quizzesQuiz_id" TEXT NOT NULL,
    CONSTRAINT "Questions_quizzesQuiz_id_fkey" FOREIGN KEY ("quizzesQuiz_id") REFERENCES "Quizzes" ("quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Options" (
    "option_id" TEXT NOT NULL PRIMARY KEY,
    "option_text" TEXT NOT NULL,
    "option_index" INTEGER NOT NULL,
    "is_correct_answer" BOOLEAN NOT NULL,
    "questionsQuestion_id" TEXT,
    CONSTRAINT "Options_questionsQuestion_id_fkey" FOREIGN KEY ("questionsQuestion_id") REFERENCES "Questions" ("question_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Answers" (
    "answer_id" TEXT NOT NULL PRIMARY KEY,
    "optionsOption_id" TEXT NOT NULL,
    "questionsQuestion_id" TEXT NOT NULL,
    "gamesGame_id" TEXT NOT NULL,
    CONSTRAINT "Answers_optionsOption_id_fkey" FOREIGN KEY ("optionsOption_id") REFERENCES "Options" ("option_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Answers_questionsQuestion_id_fkey" FOREIGN KEY ("questionsQuestion_id") REFERENCES "Questions" ("question_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Answers_gamesGame_id_fkey" FOREIGN KEY ("gamesGame_id") REFERENCES "Games" ("game_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Games" (
    "game_id" TEXT NOT NULL PRIMARY KEY,
    "current_question_index" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizzesQuiz_id" TEXT NOT NULL,
    "userUser_id" TEXT,
    CONSTRAINT "Games_quizzesQuiz_id_fkey" FOREIGN KEY ("quizzesQuiz_id") REFERENCES "Quizzes" ("quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Games_userUser_id_fkey" FOREIGN KEY ("userUser_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");
