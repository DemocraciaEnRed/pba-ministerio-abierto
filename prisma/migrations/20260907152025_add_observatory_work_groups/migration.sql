-- AlterTable
ALTER TABLE `Consultation` ADD COLUMN `observatoryWorkGroupId` INTEGER NULL;

-- CreateTable
CREATE TABLE `ObservatoryWorkGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(9) NOT NULL,
    `iconColor` VARCHAR(9) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ObservatoryWorkGroup_slug_key`(`slug`),
    INDEX `ObservatoryWorkGroup_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Consultation_observatoryWorkGroupId_idx` ON `Consultation`(`observatoryWorkGroupId`);

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_observatoryWorkGroupId_fkey` FOREIGN KEY (`observatoryWorkGroupId`) REFERENCES `ObservatoryWorkGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
