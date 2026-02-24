-- CreateEnum
CREATE TYPE "TankType" AS ENUM ('FOWLR', 'REEF', 'NANO', 'PREDATOR');

-- CreateTable
CREATE TABLE "Tank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volumeGal" DOUBLE PRECISION NOT NULL,
    "type" "TankType" NOT NULL,
    "setupDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tank_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tank" ADD CONSTRAINT "Tank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
