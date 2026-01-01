import {
    isValidPhase,
    isValidMemoryFileType,
    qualityFieldMap,
    reverseQualityFieldMap,
    syncProjectToClient
} from './sync';

// Mock client-db
jest.mock('@/lib/client-db', () => ({
    db: {
        projects: {
            put: jest.fn(),
            delete: jest.fn(),
        },
        memory_files: {
            put: jest.fn(),
            where: jest.fn().mockReturnValue({
                delete: jest.fn(),
            }),
        },
    },
}));

describe('Sync Utilities', () => {
    describe('isValidPhase', () => {
        it('returns true for valid phases', () => {
            expect(isValidPhase('planning')).toBe(true);
            expect(isValidPhase('style')).toBe(true);
            expect(isValidPhase('generation')).toBe(true);
            expect(isValidPhase('export')).toBe(true);
        });

        it('returns false for invalid phases', () => {
            expect(isValidPhase('invalid')).toBe(false);
            expect(isValidPhase('testing')).toBe(false);
            expect(isValidPhase('')).toBe(false);
        });
    });

    describe('isValidMemoryFileType', () => {
        it('returns true for valid file types', () => {
            expect(isValidMemoryFileType('project.json')).toBe(true);
            expect(isValidMemoryFileType('entities.json')).toBe(true);
            expect(isValidMemoryFileType('style-anchor.json')).toBe(true);
            expect(isValidMemoryFileType('generation-log.json')).toBe(true);
            expect(isValidMemoryFileType('conversation.json')).toBe(true);
        });

        it('returns false for invalid file types', () => {
            expect(isValidMemoryFileType('invalid.json')).toBe(false);
            expect(isValidMemoryFileType('random.txt')).toBe(false);
        });
    });

    describe('Quality Field Mappings', () => {
        it('maps all quality fields correctly', () => {
            expect(qualityFieldMap).toEqual({
                art_style: 'artStyle',
                base_resolution: 'baseResolution',
                perspective: 'perspective',
                game_genre: 'gameGenre',
                theme: 'theme',
                mood: 'mood',
                color_palette: 'colorPalette',
            });
        });

        it('reverse maps check out', () => {
            expect(reverseQualityFieldMap).toEqual({
                artStyle: 'art_style',
                baseResolution: 'base_resolution',
                perspective: 'perspective',
                gameGenre: 'game_genre',
                theme: 'theme',
                mood: 'mood',
                colorPalette: 'color_palette',
            });
        });
    });
});
