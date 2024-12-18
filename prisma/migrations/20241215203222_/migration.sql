-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Answers" (
    "answer_id" TEXT NOT NULL PRIMARY KEY,
    "optionsOption_id" TEXT NOT NULL,
    "questionsQuestion_id" TEXT NOT NULL,
    "gamesGame_id" TEXT NOT NULL,
    "usersUser_id" TEXT,
    CONSTRAINT "Answers_optionsOption_id_fkey" FOREIGN KEY ("optionsOption_id") REFERENCES "Options" ("option_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Answers_questionsQuestion_id_fkey" FOREIGN KEY ("questionsQuestion_id") REFERENCES "Questions" ("question_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Answers_gamesGame_id_fkey" FOREIGN KEY ("gamesGame_id") REFERENCES "Games" ("game_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Answers_usersUser_id_fkey" FOREIGN KEY ("usersUser_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Answers" ("answer_id", "gamesGame_id", "optionsOption_id", "questionsQuestion_id") SELECT "answer_id", "gamesGame_id", "optionsOption_id", "questionsQuestion_id" FROM "Answers";
DROP TABLE "Answers";
ALTER TABLE "new_Answers" RENAME TO "Answers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
