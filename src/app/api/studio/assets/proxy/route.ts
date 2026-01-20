import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveR2AssetUrl } from "@/lib/studio/r2-storage";
import { verifyProxyToken } from "@/lib/studio/asset-proxy-token";

const proxyQuerySchema = z.object({
  gameId: z.string().min(1),
  key: z.string().min(1),
});

function withCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS(): Promise<NextResponse> {
  return withCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = proxyQuerySchema.safeParse({
      gameId: searchParams.get("gameId"),
      key: searchParams.get("key"),
    });

    if (!parsed.success) {
      console.warn("⚠️ Proxy invalid request params:", {
        gameId: searchParams.get("gameId"),
        key: searchParams.get("key"),
        hasToken: Boolean(searchParams.get("token")),
      });
      return withCorsHeaders(
        new NextResponse("Invalid request", {
          status: 400,
          headers: {
            "X-Asset-Proxy-Error": "INVALID_REQUEST",
          },
        })
      );
    }

    const { gameId, key } = parsed.data;
    const token = searchParams.get("token");
    const session = await auth();
    const hasSession = Boolean(session?.user?.id);

    if (!hasSession) {
      if (!token) {
        return withCorsHeaders(new NextResponse("Unauthorized", { status: 401 }));
      }
      try {
        const verified = verifyProxyToken({ token, gameId, key });
        if (!verified.valid) {
          console.warn("⚠️ Proxy token verification failed:", {
            reason: verified.reason,
            gameId,
            key,
          });
          return withCorsHeaders(new NextResponse("Unauthorized", { status: 401 }));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown token verification error";
        console.error("❌ Proxy token verification threw an error:", { message, gameId, key });
        return withCorsHeaders(new NextResponse("Unauthorized", { status: 401 }));
      }
    }

    console.log("🎨 Proxy asset request:", { gameId, key, hasSession });

    const assetRef = await prisma.gameAssetRef.findFirst({
      where: {
        gameId,
        game: {
          deletedAt: null,
          ...(hasSession ? { userId: session?.user?.id } : {}),
        },
        OR: [{ manifestKey: key }, { assetId: key }],
      },
    });

    if (!assetRef) {
      return withCorsHeaders(new NextResponse("Asset not found", { status: 404 }));
    }

    if (assetRef.glbData) {
      const buffer = Buffer.from(assetRef.glbData, "base64");
      return withCorsHeaders(
        new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "model/gltf-binary",
            "Cache-Control": "no-store",
          },
        })
      );
    }

    const storedUrl = assetRef.glbUrl || assetRef.modelUrl || null;
    const resolvedUrl = await resolveR2AssetUrl(storedUrl);

    if (!resolvedUrl) {
      return withCorsHeaders(new NextResponse("Asset URL missing", { status: 422 }));
    }

    const response = await fetch(resolvedUrl);
    if (!response.ok || !response.body) {
      let upstreamHost: string | null = null;
      let upstreamPath: string | null = null;
      try {
        const parsed = new URL(resolvedUrl);
        upstreamHost = parsed.host;
        upstreamPath = parsed.pathname;
      } catch {
        upstreamHost = null;
      }
      console.error("❌ Proxy fetch failed:", {
        status: response.status,
        statusText: response.statusText,
        storedUrl,
        resolvedUrl,
      });
      return withCorsHeaders(
        new NextResponse(`Asset fetch failed (${response.status})`, {
          status: response.status,
          headers: {
            "X-Asset-Proxy-Status": String(response.status),
            ...(upstreamHost ? { "X-Asset-Proxy-Upstream": upstreamHost } : {}),
            ...(upstreamPath ? { "X-Asset-Proxy-Path": upstreamPath } : {}),
          },
        })
      );
    }

    const contentType = response.headers.get("content-type") || "model/gltf-binary";
    return withCorsHeaders(
      new NextResponse(response.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store",
        },
      })
    );
  } catch (error) {
    console.error("❌ Asset proxy error:", error);
    return withCorsHeaders(new NextResponse("Proxy error", { status: 500 }));
  }
}
