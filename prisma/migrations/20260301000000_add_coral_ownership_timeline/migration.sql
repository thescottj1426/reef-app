-- CreateEnum
CREATE TYPE "CoralEventType" AS ENUM ('ACQUIRED', 'FRAGGED', 'SOLD', 'TRADED', 'GIFTED', 'OBSERVATION');

-- CreateTable
CREATE TABLE "CoralOwnershipEvent" (
    "id" TEXT NOT NULL,
    "coralId" TEXT NOT NULL,
    "eventType" "CoralEventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoralOwnershipEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CoralOwnershipEvent" ADD CONSTRAINT "CoralOwnershipEvent_coralId_fkey" FOREIGN KEY ("coralId") REFERENCES "Coral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
