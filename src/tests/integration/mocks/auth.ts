export const authMock = jest.fn();

jest.mock('@/auth', () => ({
    auth: authMock,
}));
