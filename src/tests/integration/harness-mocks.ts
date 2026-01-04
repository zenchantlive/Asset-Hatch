import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { auth } from '@/auth';

// Create a deep mock of the PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

/**
 * Global mock for Prisma
 * Intercepts all calls to the shared prisma instance and redirects to our deep mock
 */
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    prisma: prismaMock,
}));

/**
 * Global mock for Auth.js
 */
jest.mock('@/auth', () => ({
    __esModule: true,
    auth: jest.fn(),
}));

/**
 * Global mock for AI Provider calls (OpenRouter/OpenAI)
 * Intercepts common generation utilities
 */
jest.mock('@/lib/openrouter-image', () => ({
    generateFluxImage: jest.fn(),
}));

jest.mock('@/lib/image-utils', () => ({
    prepareStyleAnchorForAPI: jest.fn().mockResolvedValue('mock-base64-image'),
    base64ToBlob: jest.fn().mockResolvedValue(new Blob(['image-data'])),
}));

/**
 * Helper to reset all mocks between tests
 */
export const resetAllMocks = () => {
    prismaMock.project.findUnique.mockReset();
    prismaMock.project.findMany.mockReset();
    prismaMock.project.create.mockReset();

    prismaMock.styleAnchor.findFirst.mockReset();

    prismaMock.characterRegistry.findFirst.mockReset();
    prismaMock.characterRegistry.update.mockReset();

    prismaMock.generatedAsset.create.mockReset();

    (auth as jest.Mock).mockReset();
};

export type { DeepMockProxy };
