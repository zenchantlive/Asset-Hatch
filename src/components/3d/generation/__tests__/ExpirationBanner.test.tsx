
/**
 * @jest-environment jsdom
 */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ExpirationBanner } from '../ExpirationBanner'

describe('ExpirationBanner', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()
        jest.clearAllMocks()
    })

    it('displays the updated expiration warning message', () => {
        render(<ExpirationBanner />)
        
        // Check for the new message structure
        const messageContainer = screen.getByText(/Heads up!/i).parentElement;
        expect(messageContainer).toHaveTextContent(
            /3D model download links expire after ~24 hours unless approved and saved to your project. Export or approve before they time out. Approved models are saved permanently and are safe to use any time./i
        );
    })

    it('does not show the old misleading message', () => {
        render(<ExpirationBanner />)
        
        // The old message should not appear
        expect(screen.queryByText(/Generated 3D models have download links that expire after ~24 hours/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Export or regenerate before they time out/i)).not.toBeInTheDocument()
    })

    it('is dismissible', () => {
        render(<ExpirationBanner />)
        
        // Check that dismiss button exists
        const dismissButton = screen.getByRole('button', { name: /close/i })
        expect(dismissButton).toBeInTheDocument()
        
        // Click dismiss
        dismissButton.click()
        
        // Banner should be hidden after dismiss
        expect(screen.queryByText(/Heads up!/i)).not.toBeInTheDocument()
    })

    it('does not show if already dismissed', () => {
        // Set localStorage to simulate user has already seen the banner
        localStorage.setItem('has_seen_3d_expiration_warning', 'true')
        
        render(<ExpirationBanner />)
        
        // Banner should not be visible
        expect(screen.queryByText(/Heads up!/i)).not.toBeInTheDocument()
    })
})
