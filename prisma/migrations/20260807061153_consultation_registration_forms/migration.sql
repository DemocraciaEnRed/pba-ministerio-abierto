-- CreateTable
CREATE TABLE `ConsultationRegistrationForm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `eventAt` DATETIME(3) NOT NULL,
    `opensAt` DATETIME(3) NOT NULL,
    `closesAt` DATETIME(3) NOT NULL,
    `venueName` VARCHAR(191) NOT NULL,
    `venueAddress` VARCHAR(191) NOT NULL,
    `venueCity` VARCHAR(191) NOT NULL,
    `venueProvince` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConsultationRegistrationForm_consultationId_key`(`consultationId`),
    INDEX `ConsultationRegistrationForm_opensAt_closesAt_idx`(`opensAt`, `closesAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationRegistration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `character` ENUM('individual', 'legal_entity') NOT NULL DEFAULT 'individual',
    `entityName` VARCHAR(191) NULL,
    `entityAddress` VARCHAR(191) NULL,
    `entityEmail` VARCHAR(191) NULL,
    `entityPhone` VARCHAR(191) NULL,
    `proofAssetId` INTEGER NULL,
    `proofUrl` VARCHAR(500) NULL,
    `participationMode` ENUM('attendee', 'speaker_request', 'speaker_report') NULL,
    `presentationSummary` TEXT NULL,
    `documentationDetail` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultationRegistration_formId_createdAt_idx`(`formId`, `createdAt`),
    INDEX `ConsultationRegistration_email_idx`(`email`),
    UNIQUE INDEX `ConsultationRegistration_formId_userId_key`(`formId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationRegistrationQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationId` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ConsultationRegistrationQuestion_registrationId_displayOrder_idx`(`registrationId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsultationRegistrationForm` ADD CONSTRAINT `ConsultationRegistrationForm_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationRegistration` ADD CONSTRAINT `ConsultationRegistration_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `ConsultationRegistrationForm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationRegistration` ADD CONSTRAINT `ConsultationRegistration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationRegistration` ADD CONSTRAINT `ConsultationRegistration_proofAssetId_fkey` FOREIGN KEY (`proofAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationRegistrationQuestion` ADD CONSTRAINT `ConsultationRegistrationQuestion_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `ConsultationRegistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
