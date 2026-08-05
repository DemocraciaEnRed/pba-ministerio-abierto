-- Reemplaza el booleano `held` por un estado explícito, preservando los datos:
-- held = true -> closed (realizado); held = false -> scheduled (programado).
-- El estado `open` se asigna a mano desde el panel.

-- AlterTable
ALTER TABLE `RegionalMeetingAgendaItem`
    ADD COLUMN `state` ENUM('scheduled', 'open', 'closed') NOT NULL DEFAULT 'scheduled';

-- Migración de datos
UPDATE `RegionalMeetingAgendaItem` SET `state` = 'closed' WHERE `held` = true;

-- AlterTable
ALTER TABLE `RegionalMeetingAgendaItem` DROP COLUMN `held`;
