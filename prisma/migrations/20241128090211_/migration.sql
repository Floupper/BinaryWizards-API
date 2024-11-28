-- CreateTable
CREATE TABLE "Tags" (
    "tag_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quizzesQuiz_id" TEXT NOT NULL,
    CONSTRAINT "Tags_quizzesQuiz_id_fkey" FOREIGN KEY ("quizzesQuiz_id") REFERENCES "Quizzes" ("quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tags_name_key" ON "Tags"("name");
