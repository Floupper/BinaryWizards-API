/*
  Warnings:

  - You are about to drop the column `teamTeam_id` on the `Users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_TeamsToUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TeamsToUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Teams" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TeamsToUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Users" ("created_at", "email", "password", "user_id", "username") SELECT "created_at", "email", "password", "user_id", "username" FROM "Users";
DROP TABLE "Users";
ALTER TABLE "new_Users" RENAME TO "Users";
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_TeamsToUsers_AB_unique" ON "_TeamsToUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_TeamsToUsers_B_index" ON "_TeamsToUsers"("B");
