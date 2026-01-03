/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import {
    detectUnrenderedMarkdown,
    assertNoUnrenderedMarkdown,
    RAW_MARKDOWN_PATTERNS
} from '../markdown-regression'

describe('Markdown Regression Detection', () => {
    describe('detectUnrenderedMarkdown', () => {
        it('detects H1 headers', () => {
            const text = '# This is a heading'
            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(true)
            expect(result.issues).toHaveLength(1)
            expect(result.issues[0].pattern).toBe('H1')
        })

        it('detects H2 headers', () => {
            const text = '## Section Header'
            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(true)
            expect(result.issues[0].pattern).toBe('H2')
        })

        it('detects H3 headers', () => {
            const text = '### Subsection Header'
            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(true)
            expect(result.issues[0].pattern).toBe('H3')
        })

        it('detects bold text with asterisks', () => {
            const text = 'This is **bold** text'
            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(true)
            expect(result.issues.some(i => i.pattern === 'BOLD_ASTERISK')).toBe(true)
        })

        it('detects inline code', () => {
            const text = 'Use `console.log()` for debugging'
            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(true)
            expect(result.issues.some(i => i.pattern === 'INLINE_CODE')).toBe(true)
        })

        it('detects markdown links', () => {
            const text = 'Check out [this link](https://example.com)'
            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(true)
            expect(result.issues.some(i => i.pattern === 'MARKDOWN_LINK')).toBe(true)
        })

        it('detects multiple markdown patterns', () => {
            const text = `# Title
      
## Section

This has **bold** and \`code\` in it.

- List item 1
- List item 2`

            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(true)
            // Should detect H1, H2, BOLD, INLINE_CODE, UNORDERED_LIST
            expect(result.issues.length).toBeGreaterThan(3)
        })

        it('returns no issues for plain text', () => {
            const text = 'This is just plain text without any markdown'
            const result = detectUnrenderedMarkdown(text)

            expect(result.hasIssues).toBe(false)
            expect(result.issues).toHaveLength(0)
        })

        it('respects allowed patterns', () => {
            const text = '# This is a heading with `code`'
            const result = detectUnrenderedMarkdown(text, ['H1'])

            // H1 is allowed, but inline code should still be detected
            expect(result.hasIssues).toBe(true)
            expect(result.issues.some(i => i.pattern === 'H1')).toBe(false)
            expect(result.issues.some(i => i.pattern === 'INLINE_CODE')).toBe(true)
        })
    })

    describe('assertNoUnrenderedMarkdown', () => {
        it('throws error when markdown is detected', () => {
            const text = '## Unrendered Header'

            expect(() => {
                assertNoUnrenderedMarkdown(text)
            }).toThrow(/Found unrendered markdown/)
        })

        it('does not throw for properly rendered text', () => {
            const text = 'This is properly rendered text'

            expect(() => {
                assertNoUnrenderedMarkdown(text)
            }).not.toThrow()
        })

        it('includes helpful debugging info in error', () => {
            const text = '### Bad Header'

            expect(() => {
                assertNoUnrenderedMarkdown(text)
            }).toThrow(/H3/)
        })

        it('respects allowed patterns', () => {
            const text = '# This is allowed'

            expect(() => {
                assertNoUnrenderedMarkdown(text, ['H1'])
            }).not.toThrow()
        })
    })

    describe('RAW_MARKDOWN_PATTERNS', () => {
        it('exports all expected pattern types', () => {
            expect(RAW_MARKDOWN_PATTERNS.H1).toBeInstanceOf(RegExp)
            expect(RAW_MARKDOWN_PATTERNS.H2).toBeInstanceOf(RegExp)
            expect(RAW_MARKDOWN_PATTERNS.H3).toBeInstanceOf(RegExp)
            expect(RAW_MARKDOWN_PATTERNS.BOLD_ASTERISK).toBeInstanceOf(RegExp)
            expect(RAW_MARKDOWN_PATTERNS.INLINE_CODE).toBeInstanceOf(RegExp)
            expect(RAW_MARKDOWN_PATTERNS.MARKDOWN_LINK).toBeInstanceOf(RegExp)
        })
    })
})
