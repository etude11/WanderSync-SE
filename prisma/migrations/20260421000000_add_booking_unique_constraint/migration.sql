-- CreateIndex
CREATE UNIQUE INDEX "BookingRecord_itineraryId_providerRef_key" ON "public"."BookingRecord"("itineraryId", "providerRef");
