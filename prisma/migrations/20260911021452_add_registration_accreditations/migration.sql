-- CreateTable
CREATE TABLE `Accreditation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formId` INTEGER NOT NULL,
    `publicId` VARCHAR(16) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `opensAt` DATETIME(3) NOT NULL,
    `closesAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Accreditation_formId_key`(`formId`),
    UNIQUE INDEX `Accreditation_publicId_key`(`publicId`),
    INDEX `Accreditation_opensAt_closesAt_idx`(`opensAt`, `closesAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccreditationEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accreditationId` INTEGER NOT NULL,
    `registrationId` INTEGER NULL,
    `dni` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `accreditedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AccreditationEntry_accreditationId_accreditedAt_idx`(`accreditationId`, `accreditedAt`),
    INDEX `AccreditationEntry_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Accreditation` ADD CONSTRAINT `Accreditation_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `ConsultationRegistrationForm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccreditationEntry` ADD CONSTRAINT `AccreditationEntry_accreditationId_fkey` FOREIGN KEY (`accreditationId`) REFERENCES `Accreditation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccreditationEntry` ADD CONSTRAINT `AccreditationEntry_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `ConsultationRegistration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
