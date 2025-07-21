/*
  Warnings:

  - A unique constraint covering the columns `[playerId,year,month]` on the table `ModerationStats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `year` to the `ModerationStats` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `month` on the `ModerationStats` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "ModerationStats_playerId_month_key";

-- AlterTable
ALTER TABLE "ModerationStats" ADD COLUMN     "year" INTEGER NOT NULL,
DROP COLUMN "month",
ADD COLUMN     "month" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ModerationStats_playerId_year_month_key" ON "ModerationStats"("playerId", "year", "month");
