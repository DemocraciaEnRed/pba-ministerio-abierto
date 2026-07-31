-- AlterTable
ALTER TABLE `RegionalMeetingAgendaItem` ADD COLUMN `highlighted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `registrationUrl` VARCHAR(500) NULL;
