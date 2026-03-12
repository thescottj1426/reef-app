CREATE TYPE "EquipmentCategory" AS ENUM ('LIGHT', 'SKIMMER', 'RETURN_PUMP', 'POWERHEAD', 'DOSER', 'HEATER', 'CHILLER', 'ATO', 'CONTROLLER', 'REACTOR', 'OTHER');

CREATE TABLE "Equipment" (
  "id"        TEXT NOT NULL,
  "tankId"    TEXT NOT NULL,
  "category"  "EquipmentCategory" NOT NULL,
  "brand"     TEXT,
  "model"     TEXT,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Equipment_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
