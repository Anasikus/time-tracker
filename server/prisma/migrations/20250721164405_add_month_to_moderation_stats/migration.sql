/*
  Warnings:

  - A unique constraint covering the columns `[playerId,month]` on the table `ModerationStats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `month` to the `ModerationStats` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ModerationStats_playerId_key";

-- AlterTable
ALTER TABLE "ModerationStats" ADD COLUMN     "month" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ModerationStats_playerId_month_key" ON "ModerationStats"("playerId", "month");
