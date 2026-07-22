-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `emailVerifiedAt` DATETIME(3) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `displayName` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NULL,
    `profession` VARCHAR(191) NULL,
    `aboutMe` TEXT NULL,
    `provincia` VARCHAR(191) NULL,
    `municipio` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `avatarAssetId` INTEGER NULL,
    `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_status_idx`(`status`),
    INDEX `User_avatarAssetId_idx`(`avatarAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('email_verification', 'password_reset', 'email_change') NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `newEmail` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VerificationToken_tokenHash_key`(`tokenHash`),
    INDEX `VerificationToken_userId_type_idx`(`userId`, `type`),
    INDEX `VerificationToken_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSocialLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `platform` ENUM('linkedin', 'x', 'instagram', 'threads', 'mastodon', 'bluesky', 'substack', 'medium') NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserSocialLink_userId_idx`(`userId`),
    UNIQUE INDEX `UserSocialLink_userId_platform_key`(`userId`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Consultation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `body` TEXT NULL,
    `consultationFormat` ENUM('single', 'multiple') NOT NULL DEFAULT 'single',
    `visibility` ENUM('hidden', 'visible', 'archived') NOT NULL DEFAULT 'hidden',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `closedMessage` TEXT NULL,
    `resultsVisibility` ENUM('hidden', 'participants_only', 'public') NOT NULL DEFAULT 'hidden',
    `sectionId` INTEGER NULL,
    `createdByUserId` INTEGER NULL,
    `updatedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Consultation_slug_key`(`slug`),
    INDEX `Consultation_visibility_idx`(`visibility`),
    INDEX `Consultation_featured_idx`(`featured`),
    INDEX `Consultation_startsAt_endsAt_idx`(`startsAt`, `endsAt`),
    INDEX `Consultation_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationRelatedLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConsultationRelatedLink_consultationId_displayOrder_idx`(`consultationId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Topic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `body` TEXT NULL,
    `questionText` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `participationStartsAt` DATETIME(3) NOT NULL,
    `participationEndsAt` DATETIME(3) NULL,
    `visibility` ENUM('hidden', 'visible', 'archived') NOT NULL DEFAULT 'hidden',
    `mechanismType` ENUM('support', 'vote', 'survey') NULL,
    `publishResultsWhenParticipationEnds` BOOLEAN NOT NULL DEFAULT false,
    `configLockedAt` DATETIME(3) NULL,
    `voteAllowAbstain` BOOLEAN NOT NULL DEFAULT true,
    `surveyMinSelections` INTEGER NOT NULL DEFAULT 1,
    `surveyMaxSelections` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Topic_visibility_mechanismType_idx`(`visibility`, `mechanismType`),
    INDEX `Topic_displayOrder_idx`(`displayOrder`),
    UNIQUE INDEX `Topic_consultationId_slug_key`(`consultationId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicRelatedLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TopicRelatedLink_topicId_displayOrder_idx`(`topicId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportParticipation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SupportParticipation_userId_idx`(`userId`),
    UNIQUE INDEX `SupportParticipation_topicId_userId_key`(`topicId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VoteParticipation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `voteValue` ENUM('in_favor', 'abstain', 'against') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VoteParticipation_userId_idx`(`userId`),
    INDEX `VoteParticipation_voteValue_idx`(`voteValue`),
    UNIQUE INDEX `VoteParticipation_topicId_userId_key`(`topicId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SurveyOption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SurveyOption_topicId_displayOrder_idx`(`topicId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SurveyParticipation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `surveyOptionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SurveyParticipation_surveyOptionId_idx`(`surveyOptionId`),
    INDEX `SurveyParticipation_userId_idx`(`userId`),
    UNIQUE INDEX `SurveyParticipation_topicId_userId_surveyOptionId_key`(`topicId`, `userId`, `surveyOptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NULL,
    `topicId` INTEGER NULL,
    `authorUserId` INTEGER NOT NULL,
    `parentCommentId` INTEGER NULL,
    `body` TEXT NOT NULL,
    `authorMode` ENUM('citizen', 'institution') NOT NULL DEFAULT 'citizen',
    `moderationStatus` ENUM('visible', 'hidden', 'deleted') NOT NULL DEFAULT 'visible',
    `deletedAt` DATETIME(3) NULL,
    `deletedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comment_consultationId_moderationStatus_idx`(`consultationId`, `moderationStatus`),
    INDEX `Comment_topicId_moderationStatus_idx`(`topicId`, `moderationStatus`),
    INDEX `Comment_authorUserId_idx`(`authorUserId`),
    INDEX `Comment_parentCommentId_idx`(`parentCommentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommentReaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `reactionType` ENUM('heart', 'agree', 'idea', 'relevant', 'deepen') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommentReaction_userId_idx`(`userId`),
    UNIQUE INDEX `CommentReaction_commentId_userId_reactionType_key`(`commentId`, `userId`, `reactionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformRoleAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `role` ENUM('platform_admin', 'collaborator') NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedByUserId` INTEGER NULL,

    INDEX `PlatformRoleAssignment_assignedByUserId_idx`(`assignedByUserId`),
    UNIQUE INDEX `PlatformRoleAssignment_userId_role_key`(`userId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationMembership` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` ENUM('consultation_admin') NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedByUserId` INTEGER NULL,

    INDEX `ConsultationMembership_userId_idx`(`userId`),
    INDEX `ConsultationMembership_assignedByUserId_idx`(`assignedByUserId`),
    UNIQUE INDEX `ConsultationMembership_consultationId_userId_role_key`(`consultationId`, `userId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `altText` VARCHAR(191) NULL,
    `assetType` ENUM('uploaded_file', 'external_link') NOT NULL,
    `mediaType` ENUM('image', 'document', 'video', 'audio', 'other') NOT NULL,
    `storageProvider` ENUM('local', 's3', 'external') NOT NULL,
    `storagePath` VARCHAR(191) NULL,
    `externalUrl` VARCHAR(191) NULL,
    `originalFilename` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `sizeBytes` INTEGER NULL,
    `checksum` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `uploadedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Asset_uploadedByUserId_idx`(`uploadedByUserId`),
    INDEX `Asset_assetType_mediaType_idx`(`assetType`, `mediaType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assetId` INTEGER NOT NULL,
    `ownerType` ENUM('consultation', 'topic', 'closure') NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `role` ENUM('cover', 'attachment', 'context', 'gallery') NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AssetLink_ownerType_ownerId_role_idx`(`ownerType`, `ownerId`, `role`),
    INDEX `AssetLink_displayOrder_idx`(`displayOrder`),
    UNIQUE INDEX `AssetLink_assetId_ownerType_ownerId_role_key`(`assetId`, `ownerType`, `ownerId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Section` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Section_slug_key`(`slug`),
    INDEX `Section_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Category_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    INDEX `Category_sectionId_idx`(`sectionId`),
    UNIQUE INDEX `Category_sectionId_slug_key`(`sectionId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationCategoryAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultationCategoryAssignment_consultationId_isPrimary_idx`(`consultationId`, `isPrimary`),
    UNIQUE INDEX `ConsultationCategoryAssignment_consultationId_categoryId_key`(`consultationId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tag_slug_key`(`slug`),
    INDEX `Tag_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultationTag_tagId_idx`(`tagId`),
    UNIQUE INDEX `ConsultationTag_consultationId_tagId_key`(`consultationId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TopicTag_tagId_idx`(`tagId`),
    UNIQUE INDEX `TopicTag_topicId_tagId_key`(`topicId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `platformName` VARCHAR(191) NULL,
    `logoLightAssetId` INTEGER NULL,
    `logoDarkAssetId` INTEGER NULL,
    `symbolLightAssetId` INTEGER NULL,
    `symbolDarkAssetId` INTEGER NULL,
    `contactEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlatformSettings_logoLightAssetId_idx`(`logoLightAssetId`),
    INDEX `PlatformSettings_logoDarkAssetId_idx`(`logoDarkAssetId`),
    INDEX `PlatformSettings_symbolLightAssetId_idx`(`symbolLightAssetId`),
    INDEX `PlatformSettings_symbolDarkAssetId_idx`(`symbolDarkAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SitePage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `platformSettingsId` INTEGER NULL,
    `pageKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SitePage_pageKey_key`(`pageKey`),
    UNIQUE INDEX `SitePage_slug_key`(`slug`),
    INDEX `SitePage_platformSettingsId_idx`(`platformSettingsId`),
    INDEX `SitePage_isPublished_idx`(`isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationClosure` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultationId` INTEGER NOT NULL,
    `summaryText` TEXT NULL,
    `resultsSummary` TEXT NULL,
    `attachmentAssetId` INTEGER NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdByUserId` INTEGER NULL,
    `updatedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConsultationClosure_consultationId_key`(`consultationId`),
    INDEX `ConsultationClosure_attachmentAssetId_idx`(`attachmentAssetId`),
    INDEX `ConsultationClosure_publishedAt_idx`(`publishedAt`),
    INDEX `ConsultationClosure_createdByUserId_idx`(`createdByUserId`),
    INDEX `ConsultationClosure_updatedByUserId_idx`(`updatedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_avatarAssetId_fkey` FOREIGN KEY (`avatarAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationToken` ADD CONSTRAINT `VerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSocialLink` ADD CONSTRAINT `UserSocialLink_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_updatedByUserId_fkey` FOREIGN KEY (`updatedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationRelatedLink` ADD CONSTRAINT `ConsultationRelatedLink_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicRelatedLink` ADD CONSTRAINT `TopicRelatedLink_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportParticipation` ADD CONSTRAINT `SupportParticipation_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportParticipation` ADD CONSTRAINT `SupportParticipation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoteParticipation` ADD CONSTRAINT `VoteParticipation_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoteParticipation` ADD CONSTRAINT `VoteParticipation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyOption` ADD CONSTRAINT `SurveyOption_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyParticipation` ADD CONSTRAINT `SurveyParticipation_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyParticipation` ADD CONSTRAINT `SurveyParticipation_surveyOptionId_fkey` FOREIGN KEY (`surveyOptionId`) REFERENCES `SurveyOption`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyParticipation` ADD CONSTRAINT `SurveyParticipation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_deletedByUserId_fkey` FOREIGN KEY (`deletedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_parentCommentId_fkey` FOREIGN KEY (`parentCommentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentReaction` ADD CONSTRAINT `CommentReaction_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentReaction` ADD CONSTRAINT `CommentReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformRoleAssignment` ADD CONSTRAINT `PlatformRoleAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformRoleAssignment` ADD CONSTRAINT `PlatformRoleAssignment_assignedByUserId_fkey` FOREIGN KEY (`assignedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationMembership` ADD CONSTRAINT `ConsultationMembership_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationMembership` ADD CONSTRAINT `ConsultationMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationMembership` ADD CONSTRAINT `ConsultationMembership_assignedByUserId_fkey` FOREIGN KEY (`assignedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_uploadedByUserId_fkey` FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetLink` ADD CONSTRAINT `AssetLink_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationCategoryAssignment` ADD CONSTRAINT `ConsultationCategoryAssignment_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationCategoryAssignment` ADD CONSTRAINT `ConsultationCategoryAssignment_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationTag` ADD CONSTRAINT `ConsultationTag_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationTag` ADD CONSTRAINT `ConsultationTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicTag` ADD CONSTRAINT `TopicTag_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicTag` ADD CONSTRAINT `TopicTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformSettings` ADD CONSTRAINT `PlatformSettings_logoLightAssetId_fkey` FOREIGN KEY (`logoLightAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformSettings` ADD CONSTRAINT `PlatformSettings_logoDarkAssetId_fkey` FOREIGN KEY (`logoDarkAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformSettings` ADD CONSTRAINT `PlatformSettings_symbolLightAssetId_fkey` FOREIGN KEY (`symbolLightAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformSettings` ADD CONSTRAINT `PlatformSettings_symbolDarkAssetId_fkey` FOREIGN KEY (`symbolDarkAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SitePage` ADD CONSTRAINT `SitePage_platformSettingsId_fkey` FOREIGN KEY (`platformSettingsId`) REFERENCES `PlatformSettings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationClosure` ADD CONSTRAINT `ConsultationClosure_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationClosure` ADD CONSTRAINT `ConsultationClosure_attachmentAssetId_fkey` FOREIGN KEY (`attachmentAssetId`) REFERENCES `Asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationClosure` ADD CONSTRAINT `ConsultationClosure_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationClosure` ADD CONSTRAINT `ConsultationClosure_updatedByUserId_fkey` FOREIGN KEY (`updatedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
