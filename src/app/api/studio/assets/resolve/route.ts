import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createProxyToken } from "@/lib/studio/asset-proxy-token";

const resolveAssetSchema = z.object({
  gameId: z.string().min(1),
  key: z.string().min(1),
});

function createRequestId(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `asset_${stamp}_${rand}`;
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", requestId },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const parsed = resolveAssetSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", requestId },
        { status: 400 }
      );
    }

    const { gameId, key } = parsed.data;
    console.log("🎨 Resolving asset URL:", { requestId, gameId, key });

    const assetRef = await prisma.gameAssetRef.findFirst({
      where: {
        gameId,
        game: {
          userId: session.user.id,
          deletedAt: null,
        },
        OR: [{ manifestKey: key }, { assetId: key }],
      },
    });

    if (!assetRef) {
      console.log("⚠️ Asset not found:", { requestId, key });
      return NextResponse.json(
        { error: "ASSET_NOT_FOUND", requestId },
        { status: 404 }
      );
    }

    let url: string | null = null;
    let source: string | null = null;

    if (assetRef.glbData) {
      url = `data:application/octet-stream;base64,${assetRef.glbData}`;
      source = "data";
    } else {
      // All other asset types (3d, model, 2d, etc.) are served via proxy
      const origin = new URL(request.url).origin;
      const token = createProxyToken({ gameId, key });
      const tokenParam = encodeURIComponent(token.token);
      url = `${origin}/api/studio/assets/proxy?gameId=${encodeURIComponent(gameId)}&key=${encodeURIComponent(key)}&token=${tokenParam}`;
      source = "proxy";
    }

    if (!url) {
      console.error("❌ Asset URL missing:", { requestId, key });
      return NextResponse.json(
        { error: "URL_MISSING", requestId },
        { status: 422 }
      );
    }

    console.log("✅ Resolved asset URL:", { requestId, key, source });
    return NextResponse.json({ url, requestId, source });
  } catch (error) {
    console.error("❌ Failed to resolve asset URL:", error);
    return NextResponse.json(
      { error: "RESOLVE_FAILED", requestId },
      { status: 500 }
    );
  }
}
