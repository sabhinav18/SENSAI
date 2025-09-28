/*
  Warnings:

  - Changed the type of `demandLevel` on the `IndustryInsight` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."DemandLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "public"."IndustryInsight" DROP COLUMN "demandLevel",
ADD COLUMN     "demandLevel" "public"."DemandLevel" NOT NULL;
