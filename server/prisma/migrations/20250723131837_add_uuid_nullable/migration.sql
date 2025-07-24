/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `players` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "uuid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "players_uuid_key" ON "players"("uuid");
