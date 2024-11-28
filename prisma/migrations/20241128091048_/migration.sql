/*
  Warnings:

  - You are about to drop the column `quizzesQuiz_id` on the `Tags` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_QuizzesToTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_QuizzesToTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Quizzes" ("quiz_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_QuizzesToTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tags" ("tag_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tags" (
    "tag_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Tags" ("name", "tag_id") SELECT "name", "tag_id" FROM "Tags";
DROP TABLE "Tags";
ALTER TABLE "new_Tags" RENAME TO "Tags";
CREATE UNIQUE INDEX "Tags_name_key" ON "Tags"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_QuizzesToTags_AB_unique" ON "_QuizzesToTags"("A", "B");

-- CreateIndex
CREATE INDEX "_QuizzesToTags_B_index" ON "_QuizzesToTags"("B");
