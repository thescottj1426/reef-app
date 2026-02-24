-- CreateTable
CREATE TABLE "TankPhoto" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TankPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TankPhoto" ADD CONSTRAINT "TankPhoto_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
