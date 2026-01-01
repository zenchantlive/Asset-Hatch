import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

// Define mocks for browser globals
describe('image-utils', () => {
    let originalImage: unknown;
    let originalFileReader: unknown;
    let originalDocument: unknown;

    beforeAll(() => {
        // Save originals
        originalImage = global.Image;
        originalFileReader = global.FileReader;
        originalDocument = global.document;

        // Mock Image
        // @ts-expect-error - Mocking global Image with minimal implementation
        global.Image = class {
            width = 100;
            height = 100;
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            _src = '';
            set src(val: string) {
                this._src = val;
                // Verify output asynchronously
                setTimeout(() => {
                    if (this.onload) this.onload();
                }, 10);
            }
            get src() { return this._src; }
        };

        // Mock FileReader
        // @ts-expect-error - Mocking global FileReader
        global.FileReader = class {
            onloadend: (() => void) | null = null;
            onerror: (() => void) | null = null;
            result: string | null = null;
            readAsDataURL(blob: Blob) {
                // Return dynamic mime type based on blob input for testing
                const mimeType = blob.type || 'image/png';
                this.result = `data:${mimeType};base64,dummy`;
                setTimeout(() => {
                    if (this.onloadend) this.onloadend();
                }, 10);
            }
        };

        // Mock document (for canvas)
        global.document = {
            createElement: (tag: string) => {
                if (tag === 'canvas') {
                    // Return a partial mock that satisfies the test needs
                    return {
                        getContext: () => ({
                            drawImage: () => { },
                            getImageData: () => ({ data: [0, 0, 0, 0] }), // dummy
                        }),
                        toBlob: (callback: (b: Blob | null) => void) => callback(new Blob([])),
                        width: 0,
                        height: 0,
                    } as unknown as HTMLCanvasElement;
                }
                return {} as HTMLElement;
            }
        } as unknown as Document;
    });

    afterAll(() => {
        // Restore
        if (originalImage) {
            // @ts-expect-error - Restoring global
            global.Image = originalImage;
        } else {
            // @ts-expect-error - Deleting global
            delete global.Image;
        }

        if (originalFileReader) {
            // @ts-expect-error - Restoring global
            global.FileReader = originalFileReader;
        } else {
            // @ts-expect-error - Deleting global
            delete global.FileReader;
        }

        if (originalDocument) {
            // @ts-expect-error - Restoring global
            global.document = originalDocument;
        } else {
            // @ts-expect-error - Deleting global
            delete global.document;
        }
    });

    test('getMimeTypeFromBase64 works correctly', async () => {
        const { getMimeTypeFromBase64 } = await import('./image-utils');
        expect(getMimeTypeFromBase64('data:image/png;base64,abc')).toBe('image/png');
        expect(getMimeTypeFromBase64('data:image/jpeg;base64,abc')).toBe('image/jpeg');
        expect(getMimeTypeFromBase64('base64string')).toBe('image/png'); // fallback
    });

    test('isValidHexColor validates colors', async () => {
        const { isValidHexColor } = await import('./image-utils');
        expect(isValidHexColor('#FFFFFF')).toBe(true);
        expect(isValidHexColor('#000000')).toBe(true);
        expect(isValidHexColor('#G00000')).toBe(false); // invalid char
        expect(isValidHexColor('#FFF')).toBe(false); // strict 6 chars per implementation
    });

    test('rgbToHex converts values', async () => {
        const { rgbToHex } = await import('./image-utils');
        expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
        expect(rgbToHex(0, 0, 0)).toBe('#000000');
        expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
    });

    test('blobToBase64 works with buffer (server-side)', async () => {
        // This path uses Buffer which Bun supports
        const { blobToBase64 } = await import('./image-utils');
        const blob = new Blob(['hello'], { type: 'image/png' });
        const result = await blobToBase64(blob);
        expect(result).toContain('data:image/png;base64,');
    });
});
