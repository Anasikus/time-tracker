/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ModerationStats` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ModerationStats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[playerId]` on the table `ModerationStats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ModerationStats" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "complaints" DROP DEFAULT,
ALTER COLUMN "appeals" DROP DEFAULT,
ALTER COLUMN "modComplaints" DROP DEFAULT,
ALTER COLUMN "trainees" DROP DEFAULT,
ALTER COLUMN "moderators" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "ModerationStats_playerId_key" ON "ModerationStats"("playerId");
