-- CreateEnum
CREATE TYPE "public"."DisruptionStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- AlterTable
ALTER TABLE "public"."DisruptionEvent" ADD COLUMN     "dedupKey" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "status" "public"."DisruptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "public"."DisruptionAck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisruptionAck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisruptionAck_userId_idx" ON "public"."DisruptionAck"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DisruptionAck_userId_eventId_key" ON "public"."DisruptionAck"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "public"."DisruptionAck" ADD CONSTRAINT "DisruptionAck_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."DisruptionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
