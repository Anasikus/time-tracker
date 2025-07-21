-- AlterTable
ALTER TABLE "players" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "vacationEnd" TIMESTAMP(3),
ADD COLUMN     "vacationStart" TIMESTAMP(3);
