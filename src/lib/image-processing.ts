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

                // Create a temporary canvas for the blended strips
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = blendWidth;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) {
                    return reject(new Error("Could not get temp canvas context"));
                }

                // 2. Blend Left Edge (using right edge of image)
                // Draw right edge strip onto temp canvas
                tempCtx.drawImage(img, width - blendWidth, 0, blendWidth, height, 0, 0, blendWidth, height);
                
                // Create gradient for left side (fades in)
                const leftGradient = tempCtx.createLinearGradient(0, 0, blendWidth, 0);
                leftGradient.addColorStop(0, 'rgba(0,0,0,1)');
                leftGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                // Apply mask to temp canvas
                tempCtx.globalCompositeOperation = 'destination-out';
                tempCtx.fillStyle = leftGradient;
                tempCtx.fillRect(0, 0, blendWidth, height);
                tempCtx.globalCompositeOperation = 'source-over';

                // Draw blended strip onto main canvas
                ctx.drawImage(tempCanvas, 0, 0);

                // 3. Blend Right Edge (using left edge of image)
                tempCtx.clearRect(0, 0, blendWidth, height);
                tempCtx.drawImage(img, 0, 0, blendWidth, height, 0, 0, blendWidth, height);

                // Create gradient for right side (fades in from right)
                const rightGradient = tempCtx.createLinearGradient(0, 0, blendWidth, 0);
                rightGradient.addColorStop(0, 'rgba(0,0,0,0)');
                rightGradient.addColorStop(1, 'rgba(0,0,0,1)');

                // Apply mask to temp canvas
                tempCtx.globalCompositeOperation = 'destination-out';
                tempCtx.fillStyle = rightGradient;
                tempCtx.fillRect(0, 0, blendWidth, height);
                tempCtx.globalCompositeOperation = 'source-over';

                // Draw blended strip onto main canvas
                ctx.drawImage(tempCanvas, width - blendWidth, 0);

                resolve(canvas.toDataURL('image/jpeg', 0.95));

            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error("Failed to load image for blending"));
        img.src = imageUrl;
    });
}
