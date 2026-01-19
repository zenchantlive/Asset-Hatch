import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string | null;
  signedUrlTtlSeconds: number | null;
}

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function readEnvValue(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function loadR2Config(): R2Config | null {
  if (cachedConfig) return cachedConfig;

  const accountId = readEnvValue("R2_ACCOUNT_ID");
  const accessKeyId = readEnvValue("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnvValue("R2_SECRET_ACCESS_KEY");
  const bucketName = readEnvValue("R2_BUCKET_NAME");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  const publicBase = readEnvValue("R2_PUBLIC_BASE_URL");
  const ttlRaw = readEnvValue("R2_SIGNED_URL_TTL");
  const ttlParsed = ttlRaw ? Number(ttlRaw) : null;
  const signedUrlTtlSeconds = ttlParsed && Number.isFinite(ttlParsed) && ttlParsed > 0
    ? Math.floor(ttlParsed)
    : null;

  cachedConfig = {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl: publicBase ? normalizeBaseUrl(publicBase) : null,
    signedUrlTtlSeconds,
  };

  return cachedConfig;
}

function getR2Client(config: R2Config): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedClient;
}

function sanitizeKeyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildR2ObjectKey(options: {
  projectId: string;
  assetId: string;
  assetName?: string;
}): string {
  const baseName = options.assetName ? sanitizeKeyPart(options.assetName) : "asset";
  return `assets/3d/${options.projectId}/${baseName}-${options.assetId}.glb`;
}

export async function uploadGlbToR2(
  data: Uint8Array,
  objectKey: string
): Promise<R2UploadResult> {
  const config = loadR2Config();
  if (!config) {
    return {
      success: false,
      error: "R2 configuration missing",
    };
  }

  try {
    const client = getR2Client(config);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        Body: data,
        ContentType: "model/gltf-binary",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const url = buildR2PublicUrl(config, objectKey);

    return {
      success: true,
      key: objectKey,
      url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: message,
    };
  }
}

function buildR2PublicUrl(config: R2Config, key: string): string {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl}/${key}`;
  }
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${key}`;
}

function extractKeyFromR2Url(value: string, config: R2Config): string | null {
  if (!value.includes("://")) {
    return value;
  }

  try {
    const url = new URL(value);
    if (config.publicBaseUrl && value.startsWith(config.publicBaseUrl)) {
      const path = value.slice(config.publicBaseUrl.length);
      return path.replace(/^\/+/, "");
    }

    if (!url.hostname.endsWith("r2.cloudflarestorage.com")) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const bucket = parts[0];
    if (bucket !== config.bucketName) {
      return null;
    }

    return parts.slice(1).join("/");
  } catch {
    return null;
  }
}

export async function resolveR2AssetUrl(
  storedUrlOrKey: string | null
): Promise<string | null> {
  if (!storedUrlOrKey) return null;
  if (storedUrlOrKey.startsWith("data:")) return storedUrlOrKey;

  const config = loadR2Config();
  if (!config) return storedUrlOrKey;

  const key = extractKeyFromR2Url(storedUrlOrKey, config);
  if (!key) return storedUrlOrKey;

  const signedTtlSeconds = config.signedUrlTtlSeconds ?? 900;
  if (signedTtlSeconds) {
    try {
      const client = getR2Client(config);
      const signedUrl = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        }),
        { expiresIn: signedTtlSeconds }
      );
      return signedUrl;
    } catch {
      return buildR2PublicUrl(config, key);
    }
  }

  return buildR2PublicUrl(config, key);
}
