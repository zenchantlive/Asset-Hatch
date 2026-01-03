/**
 * Image Utilities for Asset Hatch
 *
 * Handles conversion between Blob and Base64 formats for:
 * - Style anchor reference images (stored as Blob, sent to API as base64)
 * - Generated assets (received as base64, stored as Blob)
 */

/**
 * Convert a Blob to a base64-encoded data URL string
 * @param blob - The Blob to convert
 * @returns Promise resolving to base64 data URL (e.g., "data:image/png;base64,...")
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  // Server‐side (Node) support via Buffer
  if (typeof Buffer !== 'undefined' && typeof blob.arrayBuffer === 'function') {
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mime = blob.type || 'application/octet-stream';
    return `data:${mime};base64,${base64}`;
  }
  // Fallback to browser FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to convert blob to base64: result is not a string'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read blob'));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a base64-encoded data URL string to a Blob
 * @param base64 - The base64 data URL to convert
 * @param mimeType - Optional MIME type (defaults to 'image/png')
 * @returns Promise resolving to Blob
 */
export async function base64ToBlob(base64: string, mimeType: string = 'image/png'): Promise<Blob> {
  // If it's a data URL, extract the base64 part
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  // Decode base64
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Prepare a style anchor for API calls by ensuring base64 encoding is available
 * @param styleAnchor - The style anchor with reference image
 * @returns Promise resolving to base64-encoded image string
 */
export async function prepareStyleAnchorForAPI(styleAnchor: {
  reference_image_blob: Blob;
  reference_image_base64?: string;
}): Promise<string> {
  // If base64 is already cached, use it
  if (styleAnchor.reference_image_base64) {
    return styleAnchor.reference_image_base64;
  }

  // Otherwise, convert blob to base64
  return await blobToBase64(styleAnchor.reference_image_blob);
}

/**
 * Extract MIME type from base64 data URL
 * @param base64 - Base64 data URL
 * @returns MIME type string (e.g., "image/png")
 */
export function getMimeTypeFromBase64(base64: string): string {
  if (!base64.includes('data:')) {
    return 'image/png'; // Default fallback
  }

  const match = base64.match(/data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

/**
 * Extract color palette from an image using canvas analysis
 * @param imageBlob - The image to analyze
 * @param maxColors - Maximum number of colors to extract (default: 8)
 * @returns Promise resolving to array of HEX color codes
 */
export async function extractColorPalette(
  imageBlob: Blob,
  maxColors: number = 8
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Scale down for performance (sample at max 100x100)
        const scale = Math.min(100 / img.width, 100 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Count color frequencies
        const colorCounts = new Map<string, number>();
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Round to nearest 16 to cluster similar colors
          const rRounded = Math.round(r / 16) * 16;
          const gRounded = Math.round(g / 16) * 16;
          const bRounded = Math.round(b / 16) * 16;

          const hex = rgbToHex(rRounded, gRounded, bRounded);
          colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }

        // Sort by frequency and take top N
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, maxColors)
          .map(([hex]) => hex);

        URL.revokeObjectURL(url);
        resolve(sortedColors);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert RGB values to HEX color code
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns HEX color code (e.g., "#FF5733")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('')
    .toUpperCase();
}

/**
 * Validate if a string is a valid HEX color code
 * @param hex - String to validate
 * @returns Boolean indicating validity
 */
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Resize image to specific dimensions
 * @param imageBlob - Source image
 * @param width - Target width
 * @param height - Target height
 * @returns Promise resolving to resized image as Blob
 */
export async function resizeImage(
  imageBlob: Blob,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Use nearest-neighbor for pixel art (sharp edges)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
