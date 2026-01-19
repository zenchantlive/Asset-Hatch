import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_VERSION = "v1";
const TOKEN_TTL_MS = 5 * 60 * 1000;

function readSecret(): string {
  const value = process.env.ASSET_PROXY_SECRET;
  if (!value) {
    throw new Error("ASSET_PROXY_SECRET is not configured");
  }
  return value;
}

function toBase64(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createProxyToken(payload: {
  gameId: string;
  key: string;
  now?: number;
}): { token: string; expiresAt: number } {
  const secret = readSecret();
  const issuedAt = payload.now ?? Date.now();
  const expiresAt = issuedAt + TOKEN_TTL_MS;
  const body = `${TOKEN_VERSION}:${payload.gameId}:${payload.key}:${expiresAt}`;
  const signature = signPayload(body, secret);
  return {
    token: `${toBase64(body)}.${signature}`,
    expiresAt,
  };
}

export function verifyProxyToken(input: {
  token: string;
  gameId: string;
  key: string;
  now?: number;
}): { valid: boolean; reason?: string } {
  const secret = readSecret();
  const parts = input.token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "format" };
  }

  const body = fromBase64(parts[0]);
  const signature = parts[1];
  const expected = signPayload(body, secret);
  const expectedBuf = Buffer.from(expected, "base64url");
  const providedBuf = Buffer.from(signature, "base64url");

  if (expectedBuf.length !== providedBuf.length) {
    return { valid: false, reason: "signature" };
  }

  if (!timingSafeEqual(expectedBuf, providedBuf)) {
    return { valid: false, reason: "signature" };
  }

  const [version, gameId, key, expiresRaw] = body.split(":");
  if (version !== TOKEN_VERSION) {
    return { valid: false, reason: "version" };
  }
  if (gameId !== input.gameId || key !== input.key) {
    return { valid: false, reason: "mismatch" };
  }

  const expiresAt = Number(expiresRaw);
  const now = input.now ?? Date.now();
  if (!Number.isFinite(expiresAt) || now > expiresAt) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true };
}
