import { buildAssetPrompt, calculateGenerationSize, estimateBatchCost, type ParsedAsset } from './prompt-builder';
import type { Project, StyleAnchor, CharacterRegistry } from './types';

describe('prompt-builder', () => {
    const mockProject: Project = {
        id: 'p1',
        name: 'Test Project',
        art_style: '16-bit pixel art',
        game_genre: 'platformer',
        base_resolution: '32x32',
        perspective: 'side-view',
        theme: 'fantasy',
        mood: 'cheerful',
        color_palette: 'vibrant',
        phase: 'planning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const mockAsset: ParsedAsset = {
        id: 'a1',
        category: 'Characters',
        name: 'Farmer',
        type: 'character-sprite',
        description: 'farmer with a straw hat',
        mobility: { type: 'moveable', directions: 4 },
        variant: {
            id: 'v1',
            name: 'Idle',
            pose: 'idle standing pose',
            direction: 'front',
        },
    };

    describe('buildAssetPrompt', () => {
        test('builds a basic character prompt', () => {
            const prompt = buildAssetPrompt(mockAsset, mockProject);
            expect(prompt).toContain('pixel art sprite of farmer with a straw hat');
            expect(prompt).toContain('idle standing pose');
            expect(prompt).toContain('32x32 sprite');
            expect(prompt).toContain('16-bit pixel art');
            expect(prompt).toContain('vibrant color palette');
            expect(prompt).toContain('front-facing view');
        });

        test('incorporates style anchor keywords and palette', () => {
            const mockStyleAnchor: StyleAnchor = {
                id: 's1',
                project_id: 'p1',
                style_keywords: 'Studio Ghibli style, hand-drawn',
                color_palette: ['#FF0000', '#00FF00'],
                lighting_keywords: 'soft lighting',
                flux_model: 'black-forest-labs/flux.2-pro',
                reference_image_name: 'ref.png',
                reference_image_blob: new Blob([]),
                ai_suggested: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const prompt = buildAssetPrompt(mockAsset, mockProject, mockStyleAnchor);
            expect(prompt).toContain('Studio Ghibli style');
            expect(prompt).toContain('hand-drawn');
            expect(prompt).toContain('limited color palette using #FF0000, #00FF00');
            expect(prompt).toContain('consistent with style reference image');
        });

        test('handles tileset specific prompts', () => {
            const tilesetAsset: ParsedAsset = {
                ...mockAsset,
                type: 'tileset',
                name: 'Grass Tileset',
                description: 'lush green grass',
            };

            const prompt = buildAssetPrompt(tilesetAsset, mockProject);
            expect(prompt).toContain('seamless tileset of Grass Tileset');
            expect(prompt).toContain('tileable pattern');
            expect(prompt).toContain('32x32 tile size');
        });

        test('handles icon specific prompts', () => {
            const iconAsset: ParsedAsset = {
                ...mockAsset,
                type: 'icon',
                name: 'Health Potion',
                description: 'red liquid in a glass bottle',
            };

            const prompt = buildAssetPrompt(iconAsset, mockProject);
            expect(prompt).toContain('Health Potion inventory icon');
            expect(prompt).toContain('red liquid in a glass bottle');
            expect(prompt).toContain('32x32 pixel size');
        });

        test('handles character registry consistency', () => {
            const mockRegistry: CharacterRegistry = {
                id: 'r1',
                project_id: 'p1',
                name: 'Farmer',
                base_description: 'Farmer with a blue jacket and straw hat',
                poses_generated: ['idle'],
                color_hex: {},
                style_keywords: 'pixel art',
                animations: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const prompt = buildAssetPrompt(mockAsset, mockProject, undefined, mockRegistry);
            expect(prompt).toContain('Farmer with a blue jacket and straw hat');
            expect(prompt).toContain('matching the established Farmer character design');
        });
    });

    describe('calculateGenerationSize', () => {
        test('calculates 2x size for pixel perfection', () => {
            expect(calculateGenerationSize('32x32')).toEqual({ width: 64, height: 64 });
            expect(calculateGenerationSize('64x64')).toEqual({ width: 128, height: 128 });
            expect(calculateGenerationSize('256x64')).toEqual({ width: 512, height: 128 });
        });

        test('throws on invalid resolution format', () => {
            expect(() => calculateGenerationSize('invalid')).toThrow('Invalid resolution format');
        });
    });

    describe('estimateBatchCost', () => {
        test('estimates cost correctly for different models', () => {
            // black-forest-labs/flux.2-pro cost is 0.04
            expect(estimateBatchCost(10, 'black-forest-labs/flux.2-pro')).toBeCloseTo(0.4);
        });

        test('throws on unknown model', () => {
            expect(() => estimateBatchCost(1, 'unknown')).toThrow('Unknown model');
        });
    });
});
