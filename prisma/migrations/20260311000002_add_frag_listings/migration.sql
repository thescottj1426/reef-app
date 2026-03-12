-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'PENDING', 'SOLD');

-- CreateTable
CREATE TABLE "FragListing" (
    "id" TEXT NOT NULL,
    "coralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FragListing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FragListing" ADD CONSTRAINT "FragListing_coralId_fkey" FOREIGN KEY ("coralId") REFERENCES "Coral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FragListing" ADD CONSTRAINT "FragListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
