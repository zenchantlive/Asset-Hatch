/**
 * Migration: Upload stored base64 GLB data to Cloudflare R2
 *
 * Run with: bun run scripts/migrate-glb-data-to-r2.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { prisma } from "../lib/prisma";
import { buildR2ObjectKey, loadR2Config, uploadGlbToR2 } from "../lib/studio/r2-storage";

config({ path: resolve(__dirname, "../.env.local") });

const MAX_BATCH = 50;

async function migrateGlbDataToR2(): Promise<void> {
  console.log("🚀 Starting GLB base64 migration to R2");

  const r2Config = loadR2Config();
  if (!r2Config) {
    console.error("❌ R2 configuration missing. Check R2_* env vars.");
    process.exit(1);
  }

  const refs = await prisma.gameAssetRef.findMany({
    where: { glbData: { not: null } },
    select: {
      id: true,
      assetId: true,
      assetName: true,
      projectId: true,
      glbData: true,
      glbUrl: true,
    },
    take: MAX_BATCH,
  });

  if (refs.length === 0) {
    console.log("✅ No GameAssetRef records with glbData found.");
    return;
  }

  console.log(`📦 Found ${refs.length} assets with base64 GLB data.`);

  let successCount = 0;
  let failureCount = 0;

  for (const ref of refs) {
    if (!ref.glbData) {
      continue;
    }

    try {
      const objectKey = buildR2ObjectKey({
        projectId: ref.projectId,
        assetId: ref.assetId,
        assetName: ref.assetName || undefined,
      });

      const buffer = Buffer.from(ref.glbData, "base64");
      const data = new Uint8Array(buffer);

      console.log(`📤 Uploading ${ref.assetName || ref.assetId} to R2...`);
      const uploadResult = await uploadGlbToR2(data, objectKey);

      if (uploadResult.success && uploadResult.url) {
        await prisma.gameAssetRef.update({
          where: { id: ref.id },
          data: {
            glbUrl: uploadResult.url,
            modelUrl: uploadResult.url,
            glbData: null,
          },
        });
        successCount += 1;
        console.log(`✅ Uploaded and updated ${ref.assetName || ref.assetId}`);
      } else {
        failureCount += 1;
        console.warn(
          `⚠️ Failed to upload ${ref.assetName || ref.assetId}: ${uploadResult.error || "Unknown error"}`
        );
      }
    } catch (error) {
      failureCount += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`⚠️ Migration failed for ${ref.assetName || ref.assetId}: ${message}`);
    }
  }

  console.log(`✅ Migration complete. Success: ${successCount}, Failed: ${failureCount}`);
}

migrateGlbDataToR2()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Migration failed:", message);
    process.exit(1);
  });
