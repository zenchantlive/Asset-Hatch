-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "hashedPassword" TEXT,
    "openRouterApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'planning',
    "mode" TEXT NOT NULL DEFAULT '2d',
    "artStyle" TEXT,
    "baseResolution" TEXT,
    "perspective" TEXT,
    "gameGenre" TEXT,
    "theme" TEXT,
    "mood" TEXT,
    "colorPalette" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StyleAnchor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "referenceImageName" TEXT NOT NULL,
    "referenceImageBlob" BYTEA NOT NULL,
    "referenceImageBase64" TEXT,
    "styleKeywords" TEXT NOT NULL,
    "lightingKeywords" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL,
    "fluxModel" TEXT NOT NULL,
    "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleAnchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterRegistry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseDescription" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "styleKeywords" TEXT NOT NULL,
    "successfulSeed" INTEGER,
    "posesGenerated" TEXT NOT NULL,
    "animations" TEXT NOT NULL,
    "referenceDirection" TEXT,
    "referenceImageBase64" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "seed" INTEGER,
    "metadata" TEXT,
    "promptUsed" TEXT,
    "variantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationCost" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "imageCount" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Generated3DAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL,
    "draftTaskId" TEXT,
    "rigTaskId" TEXT,
    "animationTaskIds" TEXT,
    "draftModelUrl" TEXT,
    "riggedModelUrl" TEXT,
    "animatedModelUrls" TEXT,
    "promptUsed" TEXT NOT NULL,
    "fullPrompt" TEXT,
    "isRiggable" BOOLEAN,
    "errorMessage" TEXT,
    "approvalStatus" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Generated3DAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "activeSceneId" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'planning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlan" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameFile" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameScene" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeVersion" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "fileName" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAssetRef" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "assetProjectId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "glbUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAssetRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetPlacement" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "assetRefId" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotationX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotationY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotationZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scaleX" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "scaleY" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "scaleZ" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameChatMessage" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryFile_projectId_type_key" ON "MemoryFile"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationCost_generationId_key" ON "GenerationCost"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "Generated3DAsset_projectId_assetId_key" ON "Generated3DAsset"("projectId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlan_gameId_key" ON "GamePlan"("gameId");

-- CreateIndex
CREATE INDEX "GameFile_gameId_orderIndex_idx" ON "GameFile"("gameId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "GameFile_gameId_name_key" ON "GameFile"("gameId", "name");

-- CreateIndex
CREATE INDEX "CodeVersion_gameId_createdAt_idx" ON "CodeVersion"("gameId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameAssetRef_gameId_assetId_key" ON "GameAssetRef"("gameId", "assetId");

-- CreateIndex
CREATE INDEX "GameChatMessage_gameId_createdAt_idx" ON "GameChatMessage"("gameId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryFile" ADD CONSTRAINT "MemoryFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleAnchor" ADD CONSTRAINT "StyleAnchor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRegistry" ADD CONSTRAINT "CharacterRegistry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAsset" ADD CONSTRAINT "GeneratedAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationCost" ADD CONSTRAINT "GenerationCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generated3DAsset" ADD CONSTRAINT "Generated3DAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlan" ADD CONSTRAINT "GamePlan_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameFile" ADD CONSTRAINT "GameFile_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScene" ADD CONSTRAINT "GameScene_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeVersion" ADD CONSTRAINT "CodeVersion_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAssetRef" ADD CONSTRAINT "GameAssetRef_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPlacement" ADD CONSTRAINT "AssetPlacement_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "GameScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPlacement" ADD CONSTRAINT "AssetPlacement_assetRefId_fkey" FOREIGN KEY ("assetRefId") REFERENCES "GameAssetRef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameChatMessage" ADD CONSTRAINT "GameChatMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
