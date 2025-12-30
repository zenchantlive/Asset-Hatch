/**
 * @jest-environment jsdom
 */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { PlanPreview } from '../PlanPreview'

describe('PlanPreview', () => {
    const mockOnEdit = jest.fn()
    const mockOnApprove = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Markdown Rendering', () => {
        it('renders H1 headers correctly', () => {
            const markdown = '# Main Title\n\nSome content'

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            const h1 = screen.getByRole('heading', { level: 1 })
            expect(h1).toBeInTheDocument()
            expect(h1).toHaveTextContent('Main Title')
        })

        it('renders H2 headers correctly', () => {
            const markdown = '## Section Header\n\nSome content'

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            const h2 = screen.getByRole('heading', { level: 2 })
            expect(h2).toBeInTheDocument()
            expect(h2).toHaveTextContent('Section Header')
        })

        it('renders H3 headers correctly', () => {
            const markdown = '### Subsection Header\n\nSome content'

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            const h3 = screen.getByRole('heading', { level: 3 })
            expect(h3).toBeInTheDocument()
            expect(h3).toHaveTextContent('Subsection Header')
        })

        it('does not render raw ### markdown symbols', () => {
            const markdown = '### Subsection\n\nContent here'

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            // The raw ### should not appear in the rendered output
            const h3 = screen.getByRole('heading', { level: 3 })
            expect(h3).toBeInTheDocument()
            expect(h3).toHaveTextContent('Subsection')
            expect(h3.textContent).not.toContain('###')
        })

        it('renders multiple header levels in hierarchy', () => {
            const markdown = `# Game Asset Plan

## Characters

### Main Character

- Player sprite

## Environments

### Forest Level

- Background tiles`

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            // Check all three heading levels exist
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Game Asset Plan')
            expect(screen.getByRole('heading', { level: 2, name: /Characters/i })).toBeInTheDocument()
            expect(screen.getByRole('heading', { level: 3, name: /Main Character/i })).toBeInTheDocument()
        })

        it('renders inline markdown (bold and code) within headers', () => {
            const markdown = '### **Important** Subsection with `code`'

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            const h3 = screen.getByRole('heading', { level: 3 })
            expect(h3).toBeInTheDocument()

            // Check for bold element
            const strong = h3.querySelector('strong')
            expect(strong).toBeInTheDocument()
            expect(strong).toHaveTextContent('Important')

            // Check for code element
            const code = h3.querySelector('code')
            expect(code).toBeInTheDocument()
            expect(code).toHaveTextContent('code')
        })

        it('renders list items with checkmarks', () => {
            const markdown = '- Item with checkmark ✓'

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            expect(screen.getByText(/Item with checkmark/i)).toBeInTheDocument()
        })

        it('renders regular list items', () => {
            const markdown = '- Regular list item'

            render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            expect(screen.getByText('Regular list item')).toBeInTheDocument()
        })

        it('renders tree structure lines', () => {
            const markdown = '├─ Tree item\n└─ Last item'

            const { container } = render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            expect(container.textContent).toContain('Tree item')
            expect(container.textContent).toContain('Last item')
        })
    })

    describe('Empty and Loading States', () => {
        it('shows loading state when isLoading is true', () => {
            render(
                <PlanPreview
                    markdown=""
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                    isLoading={true}
                />
            )

            expect(screen.getByText(/Forging your plan/i)).toBeInTheDocument()
        })

        it('shows empty state when markdown is empty and not loading', () => {
            render(
                <PlanPreview
                    markdown=""
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                    isLoading={false}
                />
            )

            expect(screen.getByText(/No Plan Yet/i)).toBeInTheDocument()
        })

        it('hides action buttons when markdown is empty', () => {
            render(
                <PlanPreview
                    markdown=""
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            expect(screen.queryByText('Edit Plan')).not.toBeInTheDocument()
            expect(screen.queryByText('Approve Plan')).not.toBeInTheDocument()
        })

        it('shows action buttons when markdown is present', () => {
            render(
                <PlanPreview
                    markdown="# Some Plan"
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            expect(screen.getByText('Edit Plan')).toBeInTheDocument()
            expect(screen.getByText('Approve Plan')).toBeInTheDocument()
        })
    })

    describe('Markdown Regression Tests', () => {
        it('does not display raw header markdown symbols', () => {
            const markdown = `# Game Asset Plan

## Characters Section

### Main Character

- Player sprite`

            const { container } = render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            const text = container.textContent || ''
            // Headers should not show raw # symbols
            expect(text).not.toMatch(/^#+\s/m)
        })

        it('does not display raw bold or code markdown', () => {
            const markdown = `## Section

This has **bold** text and \`code\` in it.`

            const { container } = render(
                <PlanPreview
                    markdown={markdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            const text = container.textContent || ''
            // Bold markers should be processed
            expect(text).not.toContain('**')
            // Inline code backticks should be processed  
            expect(text).not.toMatch(/`[^`]+`/)
        })

        it('processes all markdown without raw symbols in complex plans', () => {
            const complexMarkdown = `# Asset Plan

## Category A

### Subcategory 1
- Item with **emphasis**
- Item with \`code element\`

### Subcategory 2
- Another item

## Category B

Regular paragraph text with **bold**.`

            const { container } = render(
                <PlanPreview
                    markdown={complexMarkdown}
                    onEdit={mockOnEdit}
                    onApprove={mockOnApprove}
                />
            )

            const text = container.textContent || ''

            // No raw header symbols
            expect(text).not.toMatch(/^#{1,6}\s/m)
            // No raw bold
            expect(text).not.toContain('**')
            // No raw inline code  
            expect(text).not.toMatch(/`[^`]+`/)
        })
    })
})
