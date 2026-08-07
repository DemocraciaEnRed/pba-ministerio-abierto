-- CreateIndex
CREATE INDEX `Comment_consultationId_createdAt_idx` ON `Comment`(`consultationId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Comment_topicId_createdAt_idx` ON `Comment`(`topicId`, `createdAt`);
