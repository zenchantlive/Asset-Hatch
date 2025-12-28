import { describe, test, expect } from 'bun:test';
import {
    buildCharacterSpritePrompt,
    buildSpriteSheetPrompt,
    buildTilesetPrompt,
    buildUIElementPrompt,
    buildIconPrompt,
    buildBackgroundPrompt,
    selectTemplate,
    getConsistencyMarkers,
    type TemplateVariables,
    getLightingKeywords,
    getPerspectiveKeywords
} from './prompt-templates';

describe('prompt-templates', () => {
    const baseVars: TemplateVariables = {
        assetType: 'pixel art sprite',
        subject: 'test subject',
        resolution: '32x32',
        styleKeywords: 'test style',
        colorPalette: 'test palette',
        lightingKeywords: 'test lighting',
        viewDirection: 'front view',
        background: 'white background',
        consistencyMarkers: []
    };

    describe('buildCharacterSpritePrompt', () => {
        test('includes all standard components', () => {
            const prompt = buildCharacterSpritePrompt(baseVars);
            expect(prompt).toContain('pixel art sprite of test subject');
            expect(prompt).toContain('32x32 sprite');
            expect(prompt).toContain('test style');
            expect(prompt).toContain('test palette');
            expect(prompt).toContain('front view');
            expect(prompt).toContain('white background');
            expect(prompt).toContain('game-ready asset');
        });

        test('includes pose if provided', () => {
            const prompt = buildCharacterSpritePrompt({
                ...baseVars,
                pose: 'running pose'
            });
            expect(prompt).toContain('running pose');
        });

        test('includes consistency markers', () => {
            const prompt = buildCharacterSpritePrompt({
                ...baseVars,
                consistencyMarkers: ['consistent with X', 'matching Y']
            });
            expect(prompt).toContain('consistent with X, matching Y');
        });
    });

    describe('buildSpriteSheetPrompt', () => {
        test('includes frame and alignment info', () => {
            const prompt = buildSpriteSheetPrompt({
                ...baseVars,
                assetType: 'sprite sheet',
                frameCount: 8,
                arrangementType: 'horizontally',
                animationType: 'walk cycle'
            });
            expect(prompt).toContain('sprite sheet of test subject');
            expect(prompt).toContain('8 frames arranged horizontally');
            expect(prompt).toContain('walk cycle animation');
            expect(prompt).toContain('consistent proportions throughout');
            expect(prompt).toContain('evenly spaced and aligned');
        });
    });

    describe('buildTilesetPrompt', () => {
        test('includes seamless and edge markers', () => {
            const prompt = buildTilesetPrompt({
                ...baseVars,
                assetType: 'seamless tileset',
                terrainType: 'grass ground'
            });
            expect(prompt).toContain('seamless tileset of grass ground');
            expect(prompt).toContain('includes edge pieces and corner variations');
            expect(prompt).toContain('tileable pattern');
            expect(prompt).toContain('edge-matching');
        });
    });

    describe('buildUIElementPrompt', () => {
        test('includes UI specific properties', () => {
            const prompt = buildUIElementPrompt({
                ...baseVars,
                assetType: 'game UI element',
                shape: 'rounded rectangle',
                text: 'START',
                fontStyle: 'bold font',
                colorSpec: 'blue gradient'
            });
            expect(prompt).toContain('game UI test subject');
            expect(prompt).toContain('rounded rectangle');
            expect(prompt).toContain('blue gradient');
            expect(prompt).toContain("'START' in bold font");
            expect(prompt).toContain('clean sharp edges');
            expect(prompt).toContain('game HUD style');
        });
    });

    describe('buildIconPrompt', () => {
        test('includes icon details', () => {
            const prompt = buildIconPrompt({
                ...baseVars,
                assetType: 'game icon',
                itemType: 'sword',
                visualDescription: 'sharp steel blade'
            });
            expect(prompt).toContain('sword inventory icon');
            expect(prompt).toContain('sharp steel blade');
            expect(prompt).toContain('clean outline');
            expect(prompt).toContain('game asset style');
        });
    });

    describe('buildBackgroundPrompt', () => {
        test('prioritizes lighting and resolution', () => {
            const prompt = buildBackgroundPrompt({
                ...baseVars,
                assetType: 'game background'
            });
            expect(prompt).toContain('game background scene, test subject');
            expect(prompt).toContain('test lighting');
            expect(prompt).toContain('32x32');
            expect(prompt).toContain('test style');
        });
    });

    describe('selectTemplate', () => {
        test('returns correct function for asset types', () => {
            expect(selectTemplate('character-sprite')).toBe(buildCharacterSpritePrompt);
            expect(selectTemplate('sprite-sheet')).toBe(buildSpriteSheetPrompt);
            expect(selectTemplate('tileset')).toBe(buildTilesetPrompt);
            expect(selectTemplate('ui-element')).toBe(buildUIElementPrompt);
            expect(selectTemplate('icon')).toBe(buildIconPrompt);
            expect(selectTemplate('background')).toBe(buildBackgroundPrompt);
        });
    });

    describe('getConsistencyMarkers', () => {
        test('returns correct markers based on flags', () => {
            expect(getConsistencyMarkers(true, undefined, false, false)).toContain('consistent with style reference image');
            expect(getConsistencyMarkers(false, 'Farmer', true, false)).toContain('matching the established Farmer character design');
            expect(getConsistencyMarkers(false, undefined, false, true)).toContain('matching lighting in each frame');

            const allMarkers = getConsistencyMarkers(true, 'Hero', true, true);
            expect(allMarkers).toContain('consistent with style reference image');
            expect(allMarkers).toContain('matching the established Hero character design');
            expect(allMarkers).toContain('matching lighting in each frame');
        });
    });

    describe('Keywords helpers', () => {
        test('getLightingKeywords returns defaults', () => {
            expect(getLightingKeywords('character-sprite')).toContain('flat lighting');
            expect(getLightingKeywords('background')).toContain('atmospheric lighting');
        });

        test('getPerspectiveKeywords returns defaults', () => {
            expect(getPerspectiveKeywords('top-down')).toContain('top-down view');
            expect(getPerspectiveKeywords('isometric')).toContain('isometric view');
        });
    });
});
