-- AlterTable
ALTER TABLE "CharacterRegistry" ADD COLUMN "referenceDirection" TEXT;
ALTER TABLE "CharacterRegistry" ADD COLUMN "referenceImageBase64" TEXT;

-- CreateTable
CREATE TABLE "GenerationCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "totalCost" REAL NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "imageCount" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GenerationCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GenerationCost_generationId_key" ON "GenerationCost"("generationId");
