-- CreateTable
CREATE TABLE "WaterParameter" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION,
    "salinity" DOUBLE PRECISION,
    "ph" DOUBLE PRECISION,
    "alkalinity" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "magnesium" DOUBLE PRECISION,
    "nitrate" DOUBLE PRECISION,
    "phosphate" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterParameter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WaterParameter" ADD CONSTRAINT "WaterParameter_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
