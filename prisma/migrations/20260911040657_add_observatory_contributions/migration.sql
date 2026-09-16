-- CreateTable
CREATE TABLE `ObservatoryInstitutionCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ObservatoryInstitutionCategory_slug_key`(`slug`),
    INDEX `ObservatoryInstitutionCategory_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObservatoryInstitution` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ObservatoryInstitution_slug_key`(`slug`),
    INDEX `ObservatoryInstitution_categoryId_displayOrder_idx`(`categoryId`, `displayOrder`),
    INDEX `ObservatoryInstitution_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObservatoryContribution` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `provincia` VARCHAR(191) NOT NULL,
    `municipio` VARCHAR(191) NULL,
    `institutionId` INTEGER NULL,
    `institutionName` VARCHAR(191) NOT NULL,
    `institutionCategoryName` VARCHAR(191) NOT NULL,
    `workGroupId` INTEGER NOT NULL,
    `description` TEXT NULL,
    `attachmentAssetId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ObservatoryContribution_createdAt_idx`(`createdAt`),
    INDEX `ObservatoryContribution_email_idx`(`email`),
    INDEX `ObservatoryContribution_institutionId_idx`(`institutionId`),
    INDEX `ObservatoryContribution_workGroupId_idx`(`workGroupId`),
    INDEX `ObservatoryContribution_attachmentAssetId_idx`(`attachmentAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObservatoryContributionLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contributionId` INTEGER NOT NULL,
    `url` TEXT NOT NULL,
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ObservatoryContributionLink_contributionId_idx`(`contributionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ObservatoryInstitution` ADD CONSTRAINT `ObservatoryInstitution_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ObservatoryInstitutionCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContribution` ADD CONSTRAINT `ObservatoryContribution_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `ObservatoryInstitution`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContribution` ADD CONSTRAINT `ObservatoryContribution_workGroupId_fkey` FOREIGN KEY (`workGroupId`) REFERENCES `ObservatoryWorkGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContribution` ADD CONSTRAINT `ObservatoryContribution_attachmentAssetId_fkey` FOREIGN KEY (`attachmentAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryContributionLink` ADD CONSTRAINT `ObservatoryContributionLink_contributionId_fkey` FOREIGN KEY (`contributionId`) REFERENCES `ObservatoryContribution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
