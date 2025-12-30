/**
 * Markdown Rendering Regression Tests
 * 
 * These tests scan the app to detect when markdown is NOT being rendered properly.
 * They check for common markdown patterns appearing as raw text in the UI.
 */

/**
 * Common markdown patterns that should NEVER appear raw in rendered UI
 */
export const RAW_MARKDOWN_PATTERNS = {
    // Headers
    H1: /^# [^\n]+/m,
    H2: /^## [^\n]+/m,
    H3: /^### [^\n]+/m,
    H4: /^#### [^\n]+/m,

    // Emphasis
    BOLD_ASTERISK: /\*\*[^*]+\*\*/,
    BOLD_UNDERSCORE: /__[^_]+__/,
    ITALIC_ASTERISK: /\*[^*]+\*/,
    ITALIC_UNDERSCORE: /_[^_]+_/,

    // Code
    INLINE_CODE: /`[^`]+`/,
    CODE_BLOCK: /```[\s\S]*?```/,

    // Lists
    UNORDERED_LIST: /^[-*+] .+$/m,
    ORDERED_LIST: /^\d+\. .+$/m,

    // Links
    MARKDOWN_LINK: /\[([^\]]+)\]\(([^)]+)\)/,

    // Other
    BLOCKQUOTE: /^> .+$/m,
    HORIZONTAL_RULE: /^---+$/m,
} as const

/**
 * Checks if text contains unrendered markdown
 * 
 * @param text - The text content to check
 * @param allowedPatterns - Patterns to ignore (e.g., code examples)
 * @returns Object with detected markdown issues
 */
export function detectUnrenderedMarkdown(
    text: string,
    allowedPatterns: (keyof typeof RAW_MARKDOWN_PATTERNS)[] = []
): {
    hasIssues: boolean
    issues: Array<{ pattern: string; match: string }>
} {
    const issues: Array<{ pattern: string; match: string }> = []

    for (const [patternName, regex] of Object.entries(RAW_MARKDOWN_PATTERNS)) {
        // Skip allowed patterns
        if (allowedPatterns.includes(patternName as keyof typeof RAW_MARKDOWN_PATTERNS)) {
            continue
        }

        const match = text.match(regex)
        if (match) {
            issues.push({
                pattern: patternName,
                match: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
            })
        }
    }

    return {
        hasIssues: issues.length > 0,
        issues,
    }
}

/**
 * Helper to assert no unrendered markdown in element
 * Use this in your component tests to verify markdown is properly rendered
 * 
 * @example
 * ```typescript
 * const { container } = render(<YourComponent />)
 * assertNoUnrenderedMarkdown(container.textContent || '')
 * ```
 */
export function assertNoUnrenderedMarkdown(
    text: string,
    allowedPatterns: (keyof typeof RAW_MARKDOWN_PATTERNS)[] = []
): void {
    const result = detectUnrenderedMarkdown(text, allowedPatterns)

    if (result.hasIssues) {
        const issueList = result.issues
            .map(({ pattern, match }) => `  - ${pattern}: "${match}"`)
            .join('\n')

        throw new Error(
            `Found unrendered markdown in component output:\n${issueList}\n\n` +
            `This suggests markdown is not being processed. Check that:\n` +
            `  1. You're using a markdown renderer (ReactMarkdown or parseMarkdown)\n` +
            `  2. All markdown patterns are handled in your custom parser\n` +
            `  3. Text is not being rendered as plain strings`
        )
    }
}
