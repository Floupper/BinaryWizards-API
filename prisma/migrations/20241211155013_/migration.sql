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
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "Games_quizzesQuiz_id_fkey" FOREIGN KEY ("quizzesQuiz_id") REFERENCES "Quizzes" ("quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Games_userUser_id_fkey" FOREIGN KEY ("userUser_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Games" ("created_at", "current_question_index", "difficulty_level", "game_id", "game_link", "max_players", "mode", "quizzesQuiz_id", "userUser_id") SELECT "created_at", "current_question_index", "difficulty_level", "game_id", "game_link", "max_players", "mode", "quizzesQuiz_id", "userUser_id" FROM "Games";
DROP TABLE "Games";
ALTER TABLE "new_Games" RENAME TO "Games";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
