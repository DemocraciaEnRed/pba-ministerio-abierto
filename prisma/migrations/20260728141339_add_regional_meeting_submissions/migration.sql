-- CreateTable
CREATE TABLE `RegionalMeetingSubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `provincia` VARCHAR(191) NOT NULL,
    `municipio` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NULL,
    `ejeTematico` VARCHAR(191) NOT NULL,
    `subejeTematico` VARCHAR(191) NULL,
    `ideaProyecto` TEXT NULL,
    `comentarios` TEXT NULL,
    `enlaces` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RegionalMeetingSubmission_createdAt_idx`(`createdAt`),
    INDEX `RegionalMeetingSubmission_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
