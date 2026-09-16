-- CreateTable
CREATE TABLE `ObservatoryPublication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `publicationYear` INTEGER NOT NULL,
    `coverAssetId` INTEGER NULL,
    `documentAssetId` INTEGER NULL,
    `externalUrl` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ObservatoryPublication_isActive_publicationYear_displayOrder_idx`(`isActive`, `publicationYear`, `displayOrder`),
    INDEX `ObservatoryPublication_coverAssetId_idx`(`coverAssetId`),
    INDEX `ObservatoryPublication_documentAssetId_idx`(`documentAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObservatoryVideo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `youtubeUrl` VARCHAR(500) NOT NULL,
    `videoDate` DATE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ObservatoryVideo_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ObservatoryPublication` ADD CONSTRAINT `ObservatoryPublication_coverAssetId_fkey` FOREIGN KEY (`coverAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObservatoryPublication` ADD CONSTRAINT `ObservatoryPublication_documentAssetId_fkey` FOREIGN KEY (`documentAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
