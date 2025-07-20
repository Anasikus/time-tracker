-- DropForeignKey
ALTER TABLE "TimeLog" DROP CONSTRAINT "TimeLog_playerId_fkey";

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
