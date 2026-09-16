/*
  Warnings:

  - You are about to drop the column `observatoryWorkGroupId` on the `Consultation` table. All the data in the column will be lost.
  - You are about to drop the column `workGroupId` on the `ObservatoryContribution` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Consultation` DROP FOREIGN KEY `Consultation_observatoryWorkGroupId_fkey`;

-- DropForeignKey
ALTER TABLE `ObservatoryContribution` DROP FOREIGN KEY `ObservatoryContribution_workGroupId_fkey`;

-- DropIndex
DROP INDEX `Consultation_observatoryWorkGroupId_idx` ON `Consultation`;

-- DropIndex
DROP INDEX `ObservatoryContribution_workGroupId_idx` ON `ObservatoryContribution`;

-- AlterTable
ALTER TABLE `Consultation` DROP COLUMN `observatoryWorkGroupId`;

-- AlterTable
ALTER TABLE `ObservatoryContribution` DROP COLUMN `workGroupId`;

-- CreateTable
CREATE TABLE `ConsultationObservatoryWorkGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `workGroupId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultationObservatoryWorkGroup_workGroupId_idx`(`workGroupId`),
    UNIQUE INDEX `ConsultationObservatoryWorkGroup_consultationId_workGroupId_key`(`consultationId`, `workGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObservatoryContributionWorkGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contributionId` INTEGER NOT NULL,
    `workGroupId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ObservatoryContributionWorkGroup_workGroupId_idx`(`workGroupId`),
    UNIQUE INDEX `ObservatoryContributionWorkGroup_contributionId_workGroupId_key`(`contributionId`, `workGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsultationObservatoryWorkGroup` ADD CONSTRAINT `ConsultationObservatoryWorkGroup_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationObservatoryWorkGroup` ADD CONSTRAINT `ConsultationObservatoryWorkGroup_workGroupId_fkey` FOREIGN KEY (`workGroupId`) REFERENCES `ObservatoryWorkGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContributionWorkGroup` ADD CONSTRAINT `ObservatoryContributionWorkGroup_contributionId_fkey` FOREIGN KEY (`contributionId`) REFERENCES `ObservatoryContribution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContributionWorkGroup` ADD CONSTRAINT `ObservatoryContributionWorkGroup_workGroupId_fkey` FOREIGN KEY (`workGroupId`) REFERENCES `ObservatoryWorkGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
