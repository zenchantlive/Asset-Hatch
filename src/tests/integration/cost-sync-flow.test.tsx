/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { VersionCarousel } from '@/components/generation/VersionCarousel';
import type { AssetVersion } from '@/lib/client-db';

describe('Cost Sync UI Feedback', () => {
    const mockVersion: AssetVersion = {
        id: 'v1',
        project_id: 'p1',
        asset_id: 'a1',
        version_number: 1,
        image_blob: new Blob(),
        prompt_used: 'test prompt',
        generation_metadata: {
            model: 'test-model',
            seed: 12345,
            cost: 0.02,
            duration_ms: 1000,
            generation_id: 'gen-123'
        },
        created_at: new Date().toISOString()
    };

    const defaultProps = {
        versions: [mockVersion],
        currentIndex: 0,
        onIndexChange: jest.fn(),
        onApprove: jest.fn(),
        onReject: jest.fn(),
    };

    it('should display (est.) suffix when cost is an estimate', () => {
        // This test is expected to fail initially as the label isn't implemented
        render(<VersionCarousel {...defaultProps} isSyncingCost={true} />);

        const costElement = screen.getByText(/Cost:/i).parentElement;
        expect(costElement).toHaveTextContent(/\(est\.\)/i);
    });

    it('should display (actual) prefix when cost sync is complete', () => {
        // This test is expected to fail initially as the label isn't implemented
        render(<VersionCarousel {...defaultProps} isSyncingCost={false} />);

        const costElement = screen.getByText(/Cost:/i).parentElement;
        expect(costElement).toHaveTextContent(/\(actual\)/i);
    });

    it('should show loading spinner during sync', () => {
        // Already partially implemented, but let's verify it explicitly
        const { container } = render(<VersionCarousel {...defaultProps} isSyncingCost={true} />);
        const loader = container.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
    });

    it('should show error state if sync fails', () => {
        // This test is expected to fail initially as the error state isn't implemented
        const propsWithError = {
            ...defaultProps,
            syncError: new Error('Network error')
        };
        render(<VersionCarousel {...propsWithError} />);

        const errorIcon = screen.getByTitle(/Sync failed/i);
        expect(errorIcon).toBeInTheDocument();
    });
});
