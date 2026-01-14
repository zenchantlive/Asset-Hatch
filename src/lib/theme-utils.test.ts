/**
 * Unit tests for theme utilities
 */

// Mock document for testing
const mockDocument = {
  body: {
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    getAttribute: jest.fn(),
  },
};

describe('theme-utils', () => {
  let applyModeTheme: typeof import('./theme-utils').applyModeTheme;
  let resetModeTheme: typeof import('./theme-utils').resetModeTheme;
  let is3DMode: typeof import('./theme-utils').is3DMode;
  let getCurrentMode: typeof import('./theme-utils').getCurrentMode;
  let toggleMode: typeof import('./theme-utils').toggleMode;

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();

    // Mock document before importing
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true,
    });

    // Re-import to get fresh functions
    const module = await import('./theme-utils');
    applyModeTheme = module.applyModeTheme;
    resetModeTheme = module.resetModeTheme;
    is3DMode = module.is3DMode;
    getCurrentMode = module.getCurrentMode;
    toggleMode = module.toggleMode;
  });

  describe('applyModeTheme', () => {
    test('sets data-mode attribute for 2d mode', () => {
      applyModeTheme('2d');
      expect(mockDocument.body.setAttribute).toHaveBeenCalledWith('data-mode', '2d');
    });

    test('sets data-mode attribute for 3d mode', () => {
      applyModeTheme('3d');
      expect(mockDocument.body.setAttribute).toHaveBeenCalledWith('data-mode', '3d');
    });

    test('does not throw when document is undefined', () => {
      Object.defineProperty(global, 'document', { value: undefined, writable: true });
      expect(() => applyModeTheme('2d')).not.toThrow();
    });
  });

  describe('resetModeTheme', () => {
    test('removes data-mode attribute', () => {
      resetModeTheme();
      expect(mockDocument.body.removeAttribute).toHaveBeenCalledWith('data-mode');
    });

    test('does not throw when document is undefined', () => {
      Object.defineProperty(global, 'document', { value: undefined, writable: true });
      expect(() => resetModeTheme()).not.toThrow();
    });
  });

  describe('is3DMode', () => {
    test('returns true when data-mode is 3d', () => {
      mockDocument.body.getAttribute.mockReturnValue('3d');
      expect(is3DMode()).toBe(true);
    });

    test('returns false when data-mode is 2d', () => {
      mockDocument.body.getAttribute.mockReturnValue('2d');
      expect(is3DMode()).toBe(false);
    });

    test('returns false when data-mode is null', () => {
      mockDocument.body.getAttribute.mockReturnValue(null);
      expect(is3DMode()).toBe(false);
    });

    test('returns false when document is undefined', () => {
      Object.defineProperty(global, 'document', { value: undefined, writable: true });
      expect(is3DMode()).toBe(false);
    });
  });

  describe('getCurrentMode', () => {
    test('returns 3d when data-mode is 3d', () => {
      mockDocument.body.getAttribute.mockReturnValue('3d');
      expect(getCurrentMode()).toBe('3d');
    });

    test('returns 2d when data-mode is 2d', () => {
      mockDocument.body.getAttribute.mockReturnValue('2d');
      expect(getCurrentMode()).toBe('2d');
    });

    test('returns 2d when data-mode is null', () => {
      mockDocument.body.getAttribute.mockReturnValue(null);
      expect(getCurrentMode()).toBe('2d');
    });

    test('returns 2d when data-mode is undefined', () => {
      mockDocument.body.getAttribute.mockReturnValue(undefined);
      expect(getCurrentMode()).toBe('2d');
    });

    test('returns 2d when document is undefined', () => {
      Object.defineProperty(global, 'document', { value: undefined, writable: true });
      expect(getCurrentMode()).toBe('2d');
    });
  });

  describe('toggleMode', () => {
    test('toggles from 2d to 3d', () => {
      const result = toggleMode('2d');
      expect(result).toBe('3d');
      expect(mockDocument.body.setAttribute).toHaveBeenCalledWith('data-mode', '3d');
    });

    test('toggles from 3d to 2d', () => {
      const result = toggleMode('3d');
      expect(result).toBe('2d');
      expect(mockDocument.body.setAttribute).toHaveBeenCalledWith('data-mode', '2d');
    });

    test('returns the new mode', () => {
      expect(toggleMode('2d')).toBe('3d');
      expect(toggleMode('3d')).toBe('2d');
    });
  });
});
