/*
  Warnings:

  - Changed the type of `marketOutlook` on the `IndustryInsight` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."MarketOutlook" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- AlterTable
ALTER TABLE "public"."IndustryInsight" DROP COLUMN "marketOutlook",
ADD COLUMN     "marketOutlook" "public"."MarketOutlook" NOT NULL;
