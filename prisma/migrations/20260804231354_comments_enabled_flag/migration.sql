-- AlterTable
ALTER TABLE `Consultation` ADD COLUMN `commentsEnabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Topic` ADD COLUMN `commentsEnabled` BOOLEAN NOT NULL DEFAULT true;
