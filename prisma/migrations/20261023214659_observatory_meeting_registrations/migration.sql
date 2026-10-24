-- AlterTable
ALTER TABLE `ConsultationRegistration` ADD COLUMN `attendanceMode` ENUM('in_person', 'virtual') NULL,
    ADD COLUMN `institutionCategoryName` VARCHAR(191) NULL,
    ADD COLUMN `institutionId` INTEGER NULL,
    ADD COLUMN `institutionName` VARCHAR(191) NULL,
    ADD COLUMN `institutionSource` ENUM('directory', 'other', 'individual') NULL;

-- AlterTable
ALTER TABLE `ConsultationRegistrationForm` ADD COLUMN `admissionPolicy` ENUM('directory_only', 'directory_and_other', 'open') NOT NULL DEFAULT 'directory_only',
    ADD COLUMN `eventMode` ENUM('in_person', 'virtual', 'hybrid') NOT NULL DEFAULT 'in_person',
    ADD COLUMN `meetingUrl` VARCHAR(500) NULL,
    MODIFY `venueName` VARCHAR(191) NULL,
    MODIFY `venueAddress` VARCHAR(191) NULL,
    MODIFY `venueCity` VARCHAR(191) NULL,
    MODIFY `venueProvince` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ConsultationRegistration_institutionId_idx` ON `ConsultationRegistration`(`institutionId`);

-- AddForeignKey
ALTER TABLE `ConsultationRegistration` ADD CONSTRAINT `ConsultationRegistration_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `ObservatoryInstitution`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
