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
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error("Could not get canvas context"));
                }

                canvas.width = img.width;
                canvas.height = img.height;
                const width = canvas.width;
                const height = canvas.height;
                const blendWidth = Math.floor(width * blendPercentage);

                // 1. Draw the original image
                ctx.drawImage(img, 0, 0);

                // 2. Draw the right edge on the left side (for wrapping)
                ctx.drawImage(img, width - blendWidth, 0, blendWidth, height, 0, 0, blendWidth, height);

                // 3. Create a gradient that fades from transparent to black
                const leftGradient = ctx.createLinearGradient(0, 0, blendWidth, 0);
                leftGradient.addColorStop(0, 'rgba(0,0,0,0)');
                leftGradient.addColorStop(1, 'rgba(0,0,0,1)');

                // 4. Apply the gradient as a mask to blend the left edge
                ctx.globalCompositeOperation = 'destination-in';
                ctx.fillStyle = leftGradient;
                ctx.fillRect(0, 0, blendWidth, height);
                ctx.globalCompositeOperation = 'source-over';

                // 5. Draw the left edge on the right side
                ctx.drawImage(img, 0, 0, blendWidth, height, width - blendWidth, 0, blendWidth, height);

                // 6. Create a gradient that fades from black to transparent
                const rightGradient = ctx.createLinearGradient(width - blendWidth, 0, width, 0);
                rightGradient.addColorStop(0, 'rgba(0,0,0,1)');
                rightGradient.addColorStop(1, 'rgba(0,0,0,0)');

                // 7. Apply the gradient to blend the right edge
                ctx.globalCompositeOperation = 'destination-in';
                ctx.fillStyle = rightGradient;
                ctx.fillRect(width - blendWidth, 0, blendWidth, height);
                ctx.globalCompositeOperation = 'source-over';

                resolve(canvas.toDataURL('image/jpeg', 0.95));

            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error("Failed to load image for blending"));
        img.src = imageUrl;
    });
}
