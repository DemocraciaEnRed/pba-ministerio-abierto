-- AlterTable
ALTER TABLE `ObservatoryInstitution` ADD COLUMN `logoAssetId` INTEGER NULL,
    ADD COLUMN `websiteUrl` VARCHAR(500) NULL;

-- CreateIndex
CREATE INDEX `ObservatoryInstitution_logoAssetId_idx` ON `ObservatoryInstitution`(`logoAssetId`);

-- AddForeignKey
ALTER TABLE `ObservatoryInstitution` ADD CONSTRAINT `ObservatoryInstitution_logoAssetId_fkey` FOREIGN KEY (`logoAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
