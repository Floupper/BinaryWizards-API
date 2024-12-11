/*
  Warnings:

  - You are about to drop the column `option_text` on the `Options` table. All the data in the column will be lost.
  - Added the required column `mode` to the `Games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `optionContentsOptionContent_id` to the `Options` table without a default value. This is not possible if the table is not empty.
  - Made the column `questionsQuestion_id` on table `Options` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "OptionContents" (
    "optionContent_id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Teams" (
    "team_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "gamesGame_id" TEXT NOT NULL,
    CONSTRAINT "Teams_gamesGame_id_fkey" FOREIGN KEY ("gamesGame_id") REFERENCES "Games" ("game_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Games" (
    "game_id" TEXT NOT NULL PRIMARY KEY,
    "current_question_index" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizzesQuiz_id" TEXT NOT NULL,
    "userUser_id" TEXT,
    "mode" TEXT NOT NULL,
    "difficulty_level" TEXT,
    "max_players" INTEGER,
    "game_link" TEXT,
    CONSTRAINT "Games_quizzesQuiz_id_fkey" FOREIGN KEY ("quizzesQuiz_id") REFERENCES "Quizzes" ("quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Games_userUser_id_fkey" FOREIGN KEY ("userUser_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Games" ("created_at", "current_question_index", "game_id", "quizzesQuiz_id", "userUser_id") SELECT "created_at", "current_question_index", "game_id", "quizzesQuiz_id", "userUser_id" FROM "Games";
DROP TABLE "Games";
ALTER TABLE "new_Games" RENAME TO "Games";
CREATE TABLE "new_Options" (
    "option_id" TEXT NOT NULL PRIMARY KEY,
    "option_index" INTEGER NOT NULL,
    "is_correct_answer" BOOLEAN NOT NULL,
    "questionsQuestion_id" TEXT NOT NULL,
    "optionContentsOptionContent_id" TEXT NOT NULL,
    CONSTRAINT "Options_questionsQuestion_id_fkey" FOREIGN KEY ("questionsQuestion_id") REFERENCES "Questions" ("question_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Options_optionContentsOptionContent_id_fkey" FOREIGN KEY ("optionContentsOptionContent_id") REFERENCES "OptionContents" ("optionContent_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Options" ("is_correct_answer", "option_id", "option_index", "questionsQuestion_id") SELECT "is_correct_answer", "option_id", "option_index", "questionsQuestion_id" FROM "Options";
DROP TABLE "Options";
ALTER TABLE "new_Options" RENAME TO "Options";
CREATE TABLE "new_Users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamTeam_id" TEXT,
    CONSTRAINT "Users_teamTeam_id_fkey" FOREIGN KEY ("teamTeam_id") REFERENCES "Teams" ("team_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Users" ("created_at", "email", "password", "user_id", "username") SELECT "created_at", "email", "password", "user_id", "username" FROM "Users";
DROP TABLE "Users";
ALTER TABLE "new_Users" RENAME TO "Users";
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
