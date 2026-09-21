-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "latePenaltyApplied" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AppSetting" ADD COLUMN "announcementText" TEXT;
ALTER TABLE "AppSetting" ADD COLUMN "announcementUpdatedAt" DATETIME;
ALTER TABLE "AppSetting" ADD COLUMN "announcementUpdatedById" TEXT;
