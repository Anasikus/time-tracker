/*
  Warnings:

  - A unique constraint covering the columns `[playerId,date]` on the table `TimeLog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimeLog_playerId_date_key" ON "TimeLog"("playerId", "date");
