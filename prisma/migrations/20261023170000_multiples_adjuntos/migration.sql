-- Hasta 3 adjuntos por comentario, aporte del Observatorio y aporte de
-- Encuentros Regionales: se reemplaza la columna `attachmentAssetId` por una
-- tabla de unión por entidad. Primero se crean las tablas, después se copian
-- los adjuntos existentes y recién al final se borran las columnas viejas.

-- CreateTable
CREATE TABLE `CommentAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentId` INTEGER NOT NULL,
    `assetId` INTEGER NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommentAttachment_commentId_displayOrder_idx`(`commentId`, `displayOrder`),
    INDEX `CommentAttachment_assetId_idx`(`assetId`),
    UNIQUE INDEX `CommentAttachment_commentId_assetId_key`(`commentId`, `assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegionalMeetingSubmissionAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` INTEGER NOT NULL,
    `assetId` INTEGER NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RegionalMeetingSubmissionAttachment_submissionId_displayOrde_idx`(`submissionId`, `displayOrder`),
    INDEX `RegionalMeetingSubmissionAttachment_assetId_idx`(`assetId`),
    UNIQUE INDEX `RegionalMeetingSubmissionAttachment_submissionId_assetId_key`(`submissionId`, `assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObservatoryContributionAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contributionId` INTEGER NOT NULL,
    `assetId` INTEGER NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ObservatoryContributionAttachment_contributionId_displayOrde_idx`(`contributionId`, `displayOrder`),
    INDEX `ObservatoryContributionAttachment_assetId_idx`(`assetId`),
    UNIQUE INDEX `ObservatoryContributionAttachment_contributionId_assetId_key`(`contributionId`, `assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommentAttachment` ADD CONSTRAINT `CommentAttachment_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentAttachment` ADD CONSTRAINT `CommentAttachment_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegionalMeetingSubmissionAttachment` ADD CONSTRAINT `RegionalMeetingSubmissionAttachment_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `RegionalMeetingSubmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegionalMeetingSubmissionAttachment` ADD CONSTRAINT `RegionalMeetingSubmissionAttachment_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContributionAttachment` ADD CONSTRAINT `ObservatoryContributionAttachment_contributionId_fkey` FOREIGN KEY (`contributionId`) REFERENCES `ObservatoryContribution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContributionAttachment` ADD CONSTRAINT `ObservatoryContributionAttachment_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Copia de los adjuntos existentes (uno por entidad, orden 0).
INSERT INTO `CommentAttachment` (`commentId`, `assetId`, `displayOrder`, `createdAt`)
SELECT `id`, `attachmentAssetId`, 0, `createdAt` FROM `Comment` WHERE `attachmentAssetId` IS NOT NULL;

INSERT INTO `ObservatoryContributionAttachment` (`contributionId`, `assetId`, `displayOrder`, `createdAt`)
SELECT `id`, `attachmentAssetId`, 0, `createdAt` FROM `ObservatoryContribution` WHERE `attachmentAssetId` IS NOT NULL;

INSERT INTO `RegionalMeetingSubmissionAttachment` (`submissionId`, `assetId`, `displayOrder`, `createdAt`)
SELECT `id`, `attachmentAssetId`, 0, `createdAt` FROM `RegionalMeetingSubmission` WHERE `attachmentAssetId` IS NOT NULL;

-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_attachmentAssetId_fkey`;

-- DropForeignKey
ALTER TABLE `ObservatoryContribution` DROP FOREIGN KEY `ObservatoryContribution_attachmentAssetId_fkey`;

-- DropForeignKey
ALTER TABLE `RegionalMeetingSubmission` DROP FOREIGN KEY `RegionalMeetingSubmission_attachmentAssetId_fkey`;

-- DropIndex
DROP INDEX `Comment_attachmentAssetId_fkey` ON `Comment`;

-- DropIndex
DROP INDEX `ObservatoryContribution_attachmentAssetId_idx` ON `ObservatoryContribution`;

-- DropIndex
DROP INDEX `RegionalMeetingSubmission_attachmentAssetId_idx` ON `RegionalMeetingSubmission`;

-- AlterTable
ALTER TABLE `Comment` DROP COLUMN `attachmentAssetId`;

-- AlterTable
ALTER TABLE `ObservatoryContribution` DROP COLUMN `attachmentAssetId`;

-- AlterTable
ALTER TABLE `RegionalMeetingSubmission` DROP COLUMN `attachmentAssetId`;
