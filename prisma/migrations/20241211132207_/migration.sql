-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Options" (
    "option_id" TEXT NOT NULL PRIMARY KEY,
    "option_index" INTEGER NOT NULL,
    "is_correct_answer" BOOLEAN NOT NULL,
    "questionsQuestion_id" TEXT NOT NULL,
    "optionContentsOptionContent_id" TEXT,
    CONSTRAINT "Options_questionsQuestion_id_fkey" FOREIGN KEY ("questionsQuestion_id") REFERENCES "Questions" ("question_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Options_optionContentsOptionContent_id_fkey" FOREIGN KEY ("optionContentsOptionContent_id") REFERENCES "OptionContents" ("optionContent_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Options" ("is_correct_answer", "optionContentsOptionContent_id", "option_id", "option_index", "questionsQuestion_id") SELECT "is_correct_answer", "optionContentsOptionContent_id", "option_id", "option_index", "questionsQuestion_id" FROM "Options";
DROP TABLE "Options";
ALTER TABLE "new_Options" RENAME TO "Options";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
