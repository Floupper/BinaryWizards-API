/*
  Warnings:

  - You are about to drop the `Tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_QuizzesToTags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `is_public` on the `Quizzes` table. All the data in the column will be lost.
  - Added the required column `description` to the `Quizzes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Tags_name_key";

-- DropIndex
DROP INDEX "_QuizzesToTags_B_index";

-- DropIndex
DROP INDEX "_QuizzesToTags_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tags";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_QuizzesToTags";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quizzes" (
    "quiz_id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userUser_id" TEXT,
    CONSTRAINT "Quizzes_userUser_id_fkey" FOREIGN KEY ("userUser_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quizzes" ("created_at", "difficulty", "quiz_id", "title", "userUser_id") SELECT "created_at", "difficulty", "quiz_id", "title", "userUser_id" FROM "Quizzes";
DROP TABLE "Quizzes";
ALTER TABLE "new_Quizzes" RENAME TO "Quizzes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
