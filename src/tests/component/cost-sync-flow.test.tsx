import './setup-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { VersionCarousel } from '@/components/generation/VersionCarousel';
import type { AssetVersion } from '@/lib/client-db';
import { describe, it, expect, mock } from 'bun:test';

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
        onIndexChange: mock(() => { }),
        onApprove: mock(() => { }),
        onReject: mock(() => { }),
    };

    it('should display (est.) suffix when cost is an estimate', () => {
        render(<VersionCarousel {...defaultProps} isSyncingCost={true} />);

        const costElement = screen.getByText(/Cost:/i).parentElement;
        expect(costElement?.textContent).toMatch(/\(est\.\)/i);
    });

    it('should display (actual) prefix when cost sync is complete', () => {
        render(<VersionCarousel {...defaultProps} isSyncingCost={false} />);

        const costElement = screen.getByText(/Cost:/i).parentElement;
        expect(costElement?.textContent).toMatch(/\(actual\)/i);
    });

    it('should show loading spinner during sync', () => {
        const { container } = render(<VersionCarousel {...defaultProps} isSyncingCost={true} />);
        const loader = container.querySelector('.animate-spin');
        expect(loader).not.toBeNull();
    });

    it('should show error state if sync fails', () => {
        const propsWithError = {
            ...defaultProps,
            syncError: new Error('Network error')
        };
        render(<VersionCarousel {...propsWithError} />);

        const errorIcon = screen.getByTitle(/Sync failed/i);
        expect(errorIcon).not.toBeNull();
    });
});
