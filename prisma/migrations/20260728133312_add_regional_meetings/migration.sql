-- CreateTable
CREATE TABLE `RegionalMeetingAgendaItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `regionId` INTEGER NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `heldAt` DATETIME(3) NOT NULL,
    `year` INTEGER NULL,
    `held` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RegionalMeetingAgendaItem_regionId_key`(`regionId`),
    INDEX `RegionalMeetingAgendaItem_heldAt_idx`(`heldAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegionalMeetingTestimonialGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `municipality` VARCHAR(191) NOT NULL,
    `heldAt` DATETIME(3) NOT NULL,
    `regionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RegionalMeetingTestimonialGroup_regionId_idx`(`regionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegionalMeetingTestimonial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `municipality` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RegionalMeetingTestimonial_groupId_displayOrder_idx`(`groupId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RegionalMeetingAgendaItem` ADD CONSTRAINT `RegionalMeetingAgendaItem_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegionalMeetingTestimonialGroup` ADD CONSTRAINT `RegionalMeetingTestimonialGroup_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegionalMeetingTestimonial` ADD CONSTRAINT `RegionalMeetingTestimonial_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `RegionalMeetingTestimonialGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
