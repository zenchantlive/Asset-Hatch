/**
 * Code Validator for Babylon.js Game Code
 * 
 * Performs static analysis on game code to detect common issues
 * before execution. Used by createFile/updateFile tools to provide
 * immediate feedback to the AI agent.
 * 
 * @see src/lib/studio/game-tools.ts - Uses this validator
 */

/**
 * Represents a validation issue found in code
 */
export interface ValidationIssue {
    /** Severity level of the issue */
    severity: 'error' | 'warning';
    /** Human-readable description of the issue */
    message: string;
    /** Line number where issue was found (1-indexed) */
    line?: number;
    /** Suggested fix for the issue */
    suggestion?: string;
    /** Rule ID for categorization */
    ruleId: string;
}

/**
 * Result of code validation
 */
export interface ValidationResult {
    /** Whether the code is valid (no errors, warnings allowed) */
    isValid: boolean;
    /** List of errors (critical issues that will likely cause crashes) */
    errors: ValidationIssue[];
    /** List of warnings (potential issues that may cause problems) */
    warnings: ValidationIssue[];
    /** Summary message for the agent */
    summary: string;
}

/**
 * Pattern to detect potential issues in code
 */
interface ValidationRule {
    /** Unique identifier for the rule */
    id: string;
    /** Regex pattern to match problematic code */
    pattern: RegExp;
    /** Severity of the issue */
    severity: 'error' | 'warning';
    /** Human-readable message describing the issue */
    message: string;
    /** Suggested fix */
    suggestion: string;
    /** Optional: pattern that indicates the safe version is used */
    safePattern?: RegExp;
}

/**
 * Validation rules for common Babylon.js issues
 */
const VALIDATION_RULES: ValidationRule[] = [
    // Rule 1: ASSETS.load without await
    {
        id: 'async-assets-load',
        pattern: /(?<!await\s+)ASSETS\.load\s*\(/g,
        severity: 'error',
        message: 'ASSETS.load() returns a Promise and must be awaited',
        suggestion: 'Use: const mesh = await ASSETS.load("key", scene);',
    },

    // Rule 2: PhysicsAggregate without checking physics ready
    {
        id: 'physics-not-ready',
        pattern: /new\s+BABYLON\.PhysicsAggregate\s*\(/g,
        severity: 'warning',
        message: 'PhysicsAggregate created without checking if physics is ready',
        suggestion: 'Wrap in: scene.onPhysicsReadyObservable.addOnce(() => { ... });',
        safePattern: /onPhysicsReadyObservable/,
    },

    // Rule 3: Observable addOnce/add without null check
    {
        id: 'observable-null-check',
        pattern: /\.on\w+Observable\.add(Once)?\s*\(/g,
        severity: 'warning',
        message: 'Observable accessed without null check - could crash if undefined',
        suggestion: 'Add check: if (obj && obj.observable) { obj.observable.add(...) }',
        safePattern: /if\s*\([^)]*&&[^)]*Observable/,
    },

    // Rule 4: Direct property access on ASSETS.load result
    {
        id: 'unchecked-asset-property',
        pattern: /await\s+ASSETS\.load\s*\([^)]+\)\s*;?\s*\n[^\n]*\.\w+\s*[=;]/g,
        severity: 'warning',
        message: 'Accessing property on asset without null check - asset may fail to load',
        suggestion: 'Check result: if (!mesh) { mesh = createFallback(); }',
    },

    // Rule 5: Game loop without null guards
    {
        id: 'game-loop-no-guard',
        pattern: /onBeforeRenderObservable\.add\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*(?<!if\s*\([^)]+\)\s*)[a-zA-Z_$][a-zA-Z0-9_$]*\.(position|rotation|scaling)/g,
        severity: 'warning',
        message: 'Game loop accesses object properties without null guard',
        suggestion: 'Add guard: if (!obj || !obj.position) return;',
    },

    // Rule 6: Using undefined variables from other files
    {
        id: 'cross-file-dependency',
        pattern: /^(?!.*typeof\s+scene\s*[!=]==)(?!.*\/\/\s*Dependencies:).*\bscene\./m,
        severity: 'warning',
        message: 'Using "scene" without checking it exists - may fail if main.js has errors',
        suggestion: 'Add at top of file: if (typeof scene === "undefined") throw new Error("scene required");',
        safePattern: /typeof\s+scene\s*[!=]==/,
    },
];

/**
 * Find the line number for a match in code
 * 
 * @param code - Source code
 * @param matchIndex - Character index of the match
 * @returns Line number (1-indexed)
 */
function getLineNumber(code: string, matchIndex: number): number {
    // Count newlines before the match
    const beforeMatch = code.substring(0, matchIndex);
    const lineBreaks = (beforeMatch.match(/\n/g) || []).length;
    return lineBreaks + 1;
}

/**
 * Check if safe pattern exists near the problematic match
 * 
 * @param code - Source code
 * @param matchIndex - Index of the problematic match
 * @param safePattern - Pattern indicating safe usage
 * @param lookbackLines - Number of lines to look back
 * @returns Whether safe pattern was found
 */
function hasSafePattern(
    code: string,
    matchIndex: number,
    safePattern: RegExp,
    lookbackLines: number = 5
): boolean {
    // Find start of lookback region
    let lookbackStart = matchIndex;
    let newlineCount = 0;
    while (lookbackStart > 0 && newlineCount < lookbackLines) {
        lookbackStart--;
        if (code[lookbackStart] === '\n') newlineCount++;
    }

    // Check if safe pattern exists in lookback region
    const region = code.substring(lookbackStart, matchIndex);
    return safePattern.test(region);
}

/**
 * Validate Babylon.js game code for common issues
 * 
 * @param code - JavaScript code to validate
 * @param fileName - Optional filename for context
 * @returns Validation result with errors and warnings
 */
export function validateGameCode(code: string, fileName?: string): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Run each validation rule
    for (const rule of VALIDATION_RULES) {
        // Reset regex lastIndex for global patterns
        rule.pattern.lastIndex = 0;

        let match;
        while ((match = rule.pattern.exec(code)) !== null) {
            // Check if safe pattern is used nearby
            if (rule.safePattern && hasSafePattern(code, match.index, rule.safePattern)) {
                continue; // Safe pattern found, skip this match
            }

            const issue: ValidationIssue = {
                severity: rule.severity,
                message: rule.message,
                line: getLineNumber(code, match.index),
                suggestion: rule.suggestion,
                ruleId: rule.id,
            };

            if (rule.severity === 'error') {
                errors.push(issue);
            } else {
                warnings.push(issue);
            }
        }
    }

    // Build summary message
    const fileContext = fileName ? ` in ${fileName}` : '';
    let summary: string;
    if (errors.length === 0 && warnings.length === 0) {
        summary = `✅ Code validation passed${fileContext} - no issues found`;
    } else if (errors.length === 0) {
        summary = `⚠️ ${warnings.length} warning(s) found${fileContext} - code may have issues`;
    } else {
        summary = `❌ ${errors.length} error(s) and ${warnings.length} warning(s) found${fileContext} - fix before running`;
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary,
    };
}

/**
 * Format validation result as readable string for tool response
 * 
 * @param result - Validation result to format
 * @returns Formatted string
 */
export function formatValidationResult(result: ValidationResult): string {
    const lines: string[] = [result.summary];

    if (result.errors.length > 0) {
        lines.push('\nERRORS:');
        for (const error of result.errors) {
            const location = error.line ? ` (line ${error.line})` : '';
            lines.push(`  ❌ ${error.message}${location}`);
            if (error.suggestion) {
                lines.push(`     → ${error.suggestion}`);
            }
        }
    }

    if (result.warnings.length > 0) {
        lines.push('\nWARNINGS:');
        for (const warning of result.warnings) {
            const location = warning.line ? ` (line ${warning.line})` : '';
            lines.push(`  ⚠️ ${warning.message}${location}`);
            if (warning.suggestion) {
                lines.push(`     → ${warning.suggestion}`);
            }
        }
    }

    return lines.join('\n');
}
