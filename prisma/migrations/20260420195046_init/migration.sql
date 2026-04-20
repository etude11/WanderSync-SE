-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('TRAVELLER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."BookingType" AS ENUM ('FLIGHT', 'HOTEL', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "public"."DisruptionType" AS ENUM ('FLIGHT_DELAY', 'FLIGHT_CANCELLATION', 'WEATHER_ALERT', 'FLIGHT_DIVERSION');

-- CreateEnum
CREATE TYPE "public"."ConsentLevel" AS ENUM ('NONE', 'PENDING', 'CITY_LEVEL', 'PRECISE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'TRAVELLER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Itinerary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingRecord" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "type" "public"."BookingType" NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "disrupted" BOOLEAN NOT NULL DEFAULT false,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DisruptionEvent" (
    "id" TEXT NOT NULL,
    "type" "public"."DisruptionType" NOT NULL,
    "severity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "flightIata" TEXT,
    "affectedOrigin" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisruptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsentState" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "state" "public"."ConsentLevel" NOT NULL DEFAULT 'NONE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "BookingRecord_itineraryId_departureTime_idx" ON "public"."BookingRecord"("itineraryId", "departureTime");

-- CreateIndex
CREATE INDEX "BookingRecord_providerRef_idx" ON "public"."BookingRecord"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentState_userAId_userBId_key" ON "public"."ConsentState"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_deliveredAt_idx" ON "public"."NotificationLog"("userId", "deliveredAt");

-- AddForeignKey
ALTER TABLE "public"."Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingRecord" ADD CONSTRAINT "BookingRecord_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "public"."Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsentState" ADD CONSTRAINT "ConsentState_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsentState" ADD CONSTRAINT "ConsentState_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
