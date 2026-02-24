-- CreateEnum
CREATE TYPE "CoralPlacement" AS ENUM ('SANDBED', 'LOW_ROCK', 'MID_ROCK', 'HIGH_ROCK', 'FRAG_RACK');

-- CreateEnum
CREATE TYPE "LightingLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FlowLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Coral" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "placement" "CoralPlacement",
    "lighting" "LightingLevel",
    "flow" "FlowLevel",
    "acquiredDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tankId" TEXT NOT NULL,

    CONSTRAINT "Coral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoralPhoto" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "coralId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoralPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Coral" ADD CONSTRAINT "Coral_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoralPhoto" ADD CONSTRAINT "CoralPhoto_coralId_fkey" FOREIGN KEY ("coralId") REFERENCES "Coral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
