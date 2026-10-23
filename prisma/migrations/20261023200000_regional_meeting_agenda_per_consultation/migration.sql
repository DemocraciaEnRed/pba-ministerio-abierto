-- La agenda de Encuentros Regionales pasa de ser un catálogo fijo por región a
-- ser 1:1 con la consulta. Los ítems actuales no se vinculan: se descartan y
-- se vuelven a cargar al editar cada consulta.
DELETE FROM `RegionalMeetingAgendaItem`;

-- DropForeignKey
ALTER TABLE `RegionalMeetingAgendaItem` DROP FOREIGN KEY `RegionalMeetingAgendaItem_regionId_fkey`;

-- DropIndex
DROP INDEX `RegionalMeetingAgendaItem_regionId_key` ON `RegionalMeetingAgendaItem`;

-- AlterTable
ALTER TABLE `RegionalMeetingAgendaItem` DROP COLUMN `highlighted`,
    DROP COLUMN `regionId`,
    DROP COLUMN `state`,
    DROP COLUMN `year`,
    ADD COLUMN `consultationId` INTEGER NOT NULL,
    ADD COLUMN `registrationClosesAt` DATETIME(3) NULL,
    ADD COLUMN `registrationOpensAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `RegionalMeetingAgendaItem_consultationId_key` ON `RegionalMeetingAgendaItem`(`consultationId`);

-- AddForeignKey
ALTER TABLE `RegionalMeetingAgendaItem` ADD CONSTRAINT `RegionalMeetingAgendaItem_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
