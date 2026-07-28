/*
  Warnings:

  - You are about to drop the column `enlaces` on the `RegionalMeetingSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `RegionalMeetingSubmission` DROP COLUMN `enlaces`,
    ADD COLUMN `attachmentAssetId` INTEGER NULL;

-- CreateTable
CREATE TABLE `RegionalMeetingSubmissionLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` INTEGER NOT NULL,
    `url` TEXT NOT NULL,
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RegionalMeetingSubmissionLink_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `RegionalMeetingSubmission_attachmentAssetId_idx` ON `RegionalMeetingSubmission`(`attachmentAssetId`);

-- AddForeignKey
ALTER TABLE `RegionalMeetingSubmission` ADD CONSTRAINT `RegionalMeetingSubmission_attachmentAssetId_fkey` FOREIGN KEY (`attachmentAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegionalMeetingSubmissionLink` ADD CONSTRAINT `RegionalMeetingSubmissionLink_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `RegionalMeetingSubmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
