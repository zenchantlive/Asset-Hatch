/**
 * Asset Storage Utilities (Phase 10: Permanent 3D Asset Hosting)
 *
 * Provides utilities for downloading 3D assets from Tripo3D and storing them
 * as base64-encoded data for permanent access without URL expiration.
 *
 * Key features:
 * - Download GLB files from signed URLs
 * - Convert to base64 for database storage
 * - Create Blob URLs for runtime use in Babylon.js
 * - Magic bytes validation for security
 */

/**
 * Result type for asset storage operations
 */
export interface AssetStorageResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Base64-encoded GLB data (on success) */
  data?: string;
  /** Error message (on failure) */
  error?: string;
}

/**
 * Result type for binary asset downloads
 */
export interface AssetBufferResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Binary GLB data (on success) */
  data?: Uint8Array;
  /** Error message (on failure) */
  error?: string;
}

/**
 * Magic bytes for GLB/GLTF format validation
 * GLB files start with 'glTF' followed by specific binary format markers
 */
const GLB_MAGIC_BYTES = new Uint8Array([0x67, 0x6c, 0x54, 0x46]); // 'glTF'

/**
 * Download a GLB file from a URL and convert to base64
 *
 * This function:
 * 1. Fetches the GLB file from the provided URL
 * 2. Validates the file using magic bytes
 * 3. Converts to base64 for database storage
 *
 * @param url - Tripo3D signed URL for the GLB file
 * @param timeoutMs - Download timeout in milliseconds (default: 30000)
 * @returns Promise<AssetStorageResult> - Base64 data or error
 */
export async function downloadAssetAsBase64(
  url: string,
  timeoutMs: number = 30000
): Promise<AssetStorageResult> {
  try {
    const bufferResult = await downloadAssetAsBuffer(url, timeoutMs);
    if (!bufferResult.success || !bufferResult.data) {
      return {
        success: false,
        error: bufferResult.error || "Failed to download asset",
      };
    }

    // Convert to base64
    const base64Data = bufferToBase64(bufferResult.data);
    const base64Size = (base64Data.length / 1024).toFixed(2);

    console.log(
      `✅ Converted to base64 (${base64Size} KB, ${((base64Data.length / bufferResult.data.length) * 100).toFixed(1)}% overhead)`
    );

    return {
      success: true,
      data: base64Data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Unexpected error during download:", errorMessage);
    return {
      success: false,
      error: `Unexpected error: ${errorMessage}`,
    };
  }
}

/**
 * Download a GLB file from a URL and return a binary buffer
 *
 * @param url - Tripo3D signed URL for the GLB file
 * @param timeoutMs - Download timeout in milliseconds (default: 30000)
 * @returns Promise<AssetBufferResult> - Binary data or error
 */
export async function downloadAssetAsBuffer(
  url: string,
  timeoutMs: number = 30000
): Promise<AssetBufferResult> {
  const startTime = Date.now();

  try {
    console.log("📥 Starting download:", url);

    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Fetch the GLB file
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/octet-stream",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const statusText = response.statusText || "Unknown error";
        console.error(
          `❌ Download failed with status ${response.status}: ${statusText}`
        );
        return {
          success: false,
          error: `Download failed: ${response.status} ${statusText}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();

      // Check file size before processing
      if (arrayBuffer.byteLength > MAX_GL_FILE_SIZE) {
        const sizeMB = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);
        console.error(
          `❌ GLB file too large: ${sizeMB}MB (max: ${MAX_GL_FILE_SIZE / 1024 / 1024}MB)`
        );
        return {
          success: false,
          error: `File too large (${sizeMB}MB). Maximum size is ${MAX_GL_FILE_SIZE / 1024 / 1024}MB.`,
        };
      }

      const elapsed = Date.now() - startTime;
      console.log(
        `📦 Downloaded ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB in ${elapsed}ms`
      );

      const data = new Uint8Array(arrayBuffer);

      // Validate magic bytes
      const validationResult = validateGlbMagicBytes(data);
      if (!validationResult.valid) {
        console.error("❌ Invalid GLB file:", validationResult.error);
        return {
          success: false,
          error: validationResult.error,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error(`❌ Download timed out after ${timeoutMs}ms`);
        return {
          success: false,
          error: `Download timed out after ${timeoutMs}ms`,
        };
      }

      const errorMessage =
        fetchError instanceof Error ? fetchError.message : "Unknown fetch error";
      console.error("❌ Fetch error:", errorMessage);
      return {
        success: false,
        error: `Failed to fetch: ${errorMessage}`,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Unexpected error during download:", errorMessage);
    return {
      success: false,
      error: `Unexpected error: ${errorMessage}`,
    };
  }
}

/**
 * Validate GLB magic bytes at the start of the file
 *
 * GLB format:
 * - First 4 bytes: 'glTF' (magic number 0x46546C67)
 * - Bytes 4-7: Version (must be 2 for GLB)
 * - Bytes 8-11: Total file length
 *
 * @param data - Uint8Array of the file data
 * @returns Validation result with success status and error message if failed
 */
function validateGlbMagicBytes(
  data: Uint8Array
): { valid: boolean; error?: string } {
  // Check minimum size (minimum GLB is 20 bytes)
  if (data.length < 20) {
    return {
      valid: false,
      error: `File too small (${data.length} bytes). GLB files must be at least 20 bytes.`,
    };
  }

  // Check magic bytes 'glTF'
  for (let i = 0; i < 4; i++) {
    if (data[i] !== GLB_MAGIC_BYTES[i]) {
      // Provide helpful error message
      const actualHex = Array.from(data.slice(0, 4))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      return {
        valid: false,
        error: `Invalid file format. Expected 'glTF' magic bytes, got: ${actualHex}. This may not be a valid GLB file.`,
      };
    }
  }

  // Read version (little-endian 32-bit integer at offset 4)
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const version = view.getUint32(4, true);

  if (version !== 2) {
    console.warn(
      `⚠️ Unexpected GLB version: ${version} (expected 2). Attempting to proceed anyway.`
    );
  }

  // Validate chunk structure if we have enough data
  const totalLength = view.getUint32(8, true);
  if (data.length !== totalLength) {
    console.warn(
      `⚠️ File size mismatch: header says ${totalLength} bytes, actual is ${data.length} bytes`
    );
  }

  return { valid: true };
}

/**
 * Maximum GLB file size for permanent storage (50MB)
 * Prevents memory exhaustion from malicious or erroneous responses
 */
const MAX_GL_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Convert Uint8Array to base64 string
 *
 * Uses Buffer for efficient binary-to-base64 conversion.
 * This is O(n) unlike string concatenation which is O(n²).
 *
 * @param data - Uint8Array to convert
 * @returns Base64-encoded string
 */
function bufferToBase64(data: Uint8Array): string {
  // Buffer.from() is available in Node.js and modern browsers
  // For browser-only environments, use TextEncoder + btoa
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(data).toString('base64');
  }
  // Fallback for browser environments without Buffer
  let binary = '';
  const len = data.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Create a data URL from base64 GLB data
 *
 * Used for passing GLB data to Babylon.js ImportMeshAsync.
 * Format: data:application/octet-stream;base64,...
 *
 * @param base64Data - Base64-encoded GLB data
 * @returns Data URL string
 */
export function createGlbDataUrl(base64Data: string): string {
  return `data:application/octet-stream;base64,${base64Data}`;
}

/**
 * Check if a string is a data URL (base64)
 *
 * @param str - String to check
 * @returns True if it's a data URL
 */
export function isDataUrl(str: string): boolean {
  return str.startsWith("data:");
}

/**
 * Parse a data URL to extract the base64 data
 *
 * @param dataUrl - Data URL string
 * @returns Object with mimeType and base64 data, or null if invalid
 */
export function parseDataUrl(
  dataUrl: string
): { mimeType: string; data: string } | null {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return null;
    }

    return {
      mimeType: match[1],
      data: match[2],
    };
  } catch {
    return null;
  }
}

/**
 * Estimate memory usage for base64 data
 *
 * Useful for displaying storage information to users.
 *
 * @param base64Data - Base64-encoded data
 * @returns Object with binary size and formatted strings
 */
export function estimateMemoryUsage(base64Data: string): {
  binaryBytes: number;
  base64Bytes: number;
  formatted: string;
} {
  const base64Bytes = base64Data.length;
  // Base64 is ~4/3 the size of binary, so binary is ~3/4 of base64
  const binaryBytes = Math.round((base64Bytes * 3) / 4);

  let formatted: string;
  if (binaryBytes < 1024) {
    formatted = `${binaryBytes} B`;
  } else if (binaryBytes < 1024 * 1024) {
    formatted = `${(binaryBytes / 1024).toFixed(2)} KB`;
  } else {
    formatted = `${(binaryBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return {
    binaryBytes,
    base64Bytes,
    formatted,
  };
}

/**
 * Validate that a base64 string represents a valid GLB file
 *
 * @param base64Data - Base64-encoded data to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateBase64Glb(
  base64Data: string
): { isValid: boolean; error?: string } {
  try {
    // Decode base64 to check magic bytes
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const result = validateGlbMagicBytes(bytes);
    return { isValid: result.valid, error: result.error };
  } catch {
    return { isValid: false, error: "Invalid base64 encoding" };
  }
}
