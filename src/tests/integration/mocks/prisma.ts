export const prismaMock = {
    project: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
    },
    memoryFile: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
    },
    styleAnchor: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
    generatedAsset: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
    },
    characterRegistry: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

jest.mock('@/lib/prisma', () => ({
    prisma: prismaMock,
}));
