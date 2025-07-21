-- CreateTable
CREATE TABLE "ModerationStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "complaints" INTEGER NOT NULL DEFAULT 0,
    "appeals" INTEGER NOT NULL DEFAULT 0,
    "modComplaints" INTEGER NOT NULL DEFAULT 0,
    "trainees" INTEGER NOT NULL DEFAULT 0,
    "moderators" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationStats_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ModerationStats" ADD CONSTRAINT "ModerationStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
