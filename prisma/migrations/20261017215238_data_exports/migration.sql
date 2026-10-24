-- CreateTable
CREATE TABLE `DataExport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kind` ENUM('consultation_comments', 'platform_comments', 'consultation_registrations', 'consultation_accreditations', 'regional_meeting_submissions', 'observatory_contributions') NOT NULL,
    `status` ENUM('pending', 'processing', 'ready', 'failed') NOT NULL DEFAULT 'pending',
    `requestedByUserId` INTEGER NOT NULL,
    `consultationId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `filters` JSON NULL,
    `totalRows` INTEGER NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,

    INDEX `DataExport_requestedByUserId_createdAt_idx`(`requestedByUserId`, `createdAt`),
    INDEX `DataExport_consultationId_kind_idx`(`consultationId`, `kind`),
    INDEX `DataExport_kind_createdAt_idx`(`kind`, `createdAt`),
    INDEX `DataExport_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataExportFile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exportId` INTEGER NOT NULL,
    `partNumber` INTEGER NOT NULL,
    `rowCount` INTEGER NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `storagePath` VARCHAR(512) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DataExportFile_exportId_partNumber_key`(`exportId`, `partNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DataExport` ADD CONSTRAINT `DataExport_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataExport` ADD CONSTRAINT `DataExport_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataExportFile` ADD CONSTRAINT `DataExportFile_exportId_fkey` FOREIGN KEY (`exportId`) REFERENCES `DataExport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
