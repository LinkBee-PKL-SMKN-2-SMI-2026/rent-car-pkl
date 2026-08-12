-- DropForeignKey
ALTER TABLE "Bookings" DROP CONSTRAINT "Bookings_createdBy_fkey";

-- AlterTable
ALTER TABLE "Bookings" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
