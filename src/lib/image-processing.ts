/**
 * Seam Blending Utility for Equirectangular Images
 * 
 * Uses HTML Canvas to blend the left and right edges of a skybox image
 * to remove visible seams by cross-fading the transition.
 */

export async function blendSeams(imageUrl: string, blendPercentage: number = 0.05): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Draw original image
                ctx.drawImage(img, 0, 0);

                const width = canvas.width;
                const height = canvas.height;
                const blendWidth = Math.floor(width * blendPercentage);

                // Get image data for the edges
                // We grab the left edge and the right edge
                const leftData = ctx.getImageData(0, 0, blendWidth, height);
                const rightData = ctx.getImageData(width - blendWidth, 0, blendWidth, height);

                const newLeftData = ctx.createImageData(blendWidth, height);
                const newRightData = ctx.createImageData(blendWidth, height);

                // Blend Logic:
                // At x=0 (Left Edge), we want 50% Left Source + 50% Right Source (Right Edge)
                // At x=blendWidth (Inner Left), we want 100% Left Source

                // Corresponding Right Logic:
                // At x=blendWidth-1 (Right Edge of image), we want 50% Right Source + 50% Left Source

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < blendWidth; x++) {
                        const i = (y * blendWidth + x) * 4; // Index for this pixel

                        // Normalized position within the blend zone (0.0 at edge, 1.0 at interior)
                        const t = x / blendWidth;

                        // Ease function for smoother transition (e.g., hermite or smoothstep-like)
                        // Using simple linear for now: factor goes from 0.5 to 1.0
                        const blendFactor = 0.5 + (0.5 * t);

                        // --- LEFT EDGE BLENDING ---
                        // Source pixels
                        const lR = leftData.data[i];
                        const lG = leftData.data[i + 1];
                        const lB = leftData.data[i + 2];
                        // Alpha not used - we keep it at 255

                        // Pixels from the RIGHT edge (wrapping around)
                        // The "Right Edge" pixel corresponding to Left x=0 is at Right x=blendWidth-1
                        // Wait, strictly speaking, x=0 connects to x=Width-1.
                        // So leftData[x] pairs with rightData[x] if we align them.
                        // leftData[0] matches rightData[blendWidth-1]? No.
                        // leftData[0] is column 0.
                        // rightData[blendWidth-1] is column Width-1.
                        // Yes. So index in rightData is (y * blendWidth + (blendWidth - 1 - x)) * 4?
                        // Let's verify.
                        // rightData: fetched from (width - blendWidth, 0).
                        // So rightData pixel at x=0 is column (Width - blendWidth).
                        // rightData pixel at x=blendWidth-1 is column (Width - 1).
                        // So yes, Left[x=0] wants to blend with Right[x=blendWidth-1].
                        // Left[x] wants to blend with Right[blendWidth - 1 - x].

                        /*
                           Pixel Mapping:
                           Left[x] (moving inward) <-> Right[Last - x] (moving inward from edge)
                        */

                        const rightIndex = (y * blendWidth + (blendWidth - 1 - x)) * 4;

                        const rR = rightData.data[rightIndex];
                        const rG = rightData.data[rightIndex + 1];
                        const rB = rightData.data[rightIndex + 2];
                        // Alpha not used - we keep it at 255

                        // Blend them
                        // NewLeft = Left * blendFactor + Right * (1 - blendFactor)
                        newLeftData.data[i] = lR * blendFactor + rR * (1 - blendFactor);
                        newLeftData.data[i + 1] = lG * blendFactor + rG * (1 - blendFactor);
                        newLeftData.data[i + 2] = lB * blendFactor + rB * (1 - blendFactor);
                        newLeftData.data[i + 3] = 255; // Keep alpha full


                        // --- RIGHT EDGE BLENDING ---
                        // We do the symmetrical operation for the right edge.
                        // Right[x] (in its local buffer) corresponds to column (Width - blendWidth + x)
                        // x goes 0..blendWidth-1.
                        // x=blendWidth-1 is the very edge (Width-1).
                        // It should be 50/50 blend with Left[0].
                        // So at x=blendWidth-1 (Edge), blendFactor should be 0.5?
                        // Let's redefine 't' for right side.
                        // Distance from edge: d = (blendWidth - 1 - x).
                        // if x=blendWidth-1, d=0 (Edge).
                        // if x=0, d=blendWidth-1 (Interior).

                        const d = blendWidth - 1 - x;
                        const t2 = d / blendWidth; // 0 at Edge, ~1 at Interior
                        const blendFactor2 = 0.5 + (0.5 * t2);

                        // Source Right Pixel
                        const rightPixIndex = (y * blendWidth + x) * 4;
                        const srcRR = rightData.data[rightPixIndex];
                        const srcRG = rightData.data[rightPixIndex + 1];
                        const srcRB = rightData.data[rightPixIndex + 2];

                        // Corresponding Left Pixel (wrapping)
                        // Right[Edge] pairs with Left[Edge].
                        // Right[Edge - d] pairs with Left[Edge + d]?
                        // Right[Width-1] pairs with Left[0].
                        // Right[Width-1-d] pairs with Left[d].
                        // In rightData, x goes 0..blendWidth.
                        // Global column is Width - blendWidth + x.
                        // d (dist from edge) = blendWidth - 1 - x.
                        // So Global Column = Width - 1 - d.
                        // Matches Left Column = d.
                        // So we need LeftData at local x = d.

                        const leftMatchIndex = (y * blendWidth + d) * 4;

                        const srcLR = leftData.data[leftMatchIndex];
                        const srcLG = leftData.data[leftMatchIndex + 1];
                        const srcLB = leftData.data[leftMatchIndex + 2];

                        newRightData.data[rightPixIndex] = srcRR * blendFactor2 + srcLR * (1 - blendFactor2);
                        newRightData.data[rightPixIndex + 1] = srcRG * blendFactor2 + srcLG * (1 - blendFactor2);
                        newRightData.data[rightPixIndex + 2] = srcRB * blendFactor2 + srcLB * (1 - blendFactor2);
                        newRightData.data[rightPixIndex + 3] = 255;

                    }
                }

                // Put the blended data back
                ctx.putImageData(newLeftData, 0, 0);
                ctx.putImageData(newRightData, width - blendWidth, 0);

                resolve(canvas.toDataURL('image/jpeg', 0.95));

            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error("Failed to load image for blending"));
        img.src = imageUrl;
    });
}
