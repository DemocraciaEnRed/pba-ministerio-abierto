-- Las URLs públicas pasan de `/consultas/{slug}` a `/{seccion}/{id}/{slug}`.
-- Congelamos los slugs vigentes para redirigir los enlaces ya difundidos y
-- recién después dejamos que el slug se repita entre instancias.

-- CreateTable
CREATE TABLE `ConsultationLegacySlug` (
    `slug` VARCHAR(191) NOT NULL,
    `consultationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultationLegacySlug_consultationId_idx`(`consultationId`),
    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsultationLegacySlug` ADD CONSTRAINT `ConsultationLegacySlug_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: un alias por cada slug vigente (hoy únicos, así que no hay conflictos).
INSERT INTO `ConsultationLegacySlug` (`slug`, `consultationId`)
SELECT `slug`, `id` FROM `Consultation`;

-- DropIndex
DROP INDEX `Consultation_slug_key` ON `Consultation`;
