CREATE TYPE "CoralCategory" AS ENUM ('SPS', 'LPS', 'SOFTIE', 'ZOA', 'ANEMONE', 'OTHER');
ALTER TABLE "Coral" ADD COLUMN "category" "CoralCategory";
