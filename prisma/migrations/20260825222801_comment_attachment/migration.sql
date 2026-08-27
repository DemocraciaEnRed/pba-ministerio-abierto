-- AlterTable
ALTER TABLE `Comment` ADD COLUMN `attachmentAssetId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_attachmentAssetId_fkey` FOREIGN KEY (`attachmentAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
