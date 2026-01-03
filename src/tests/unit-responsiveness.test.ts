/**
 * Unit Test: Responsiveness Regression Test
 * 
 * Scans CSS and TSX files to ensure no hardcoded px values remain
 * outside of allowed exceptions (1px/2px borders).
 * 
 * This test helps maintain responsive design by catching px usage
 * that should be converted to rem units.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Directories to scan (relative to src/)
const SCAN_DIRECTORIES = [
    'app',
    'components',
    'ui-system',
];

// File extensions to check
const ALLOWED_EXTENSIONS = ['.css', '.tsx', '.ts'];

// Pattern to find px values (matches numbers followed by px)
const PX_PATTERN = /(?<!min-|max-)(\d+)px/g;

// Allowed px values (1px and 2px for borders)
const ALLOWED_PX_VALUES = new Set(['1px', '2px']);

// Files or patterns to exclude from scanning
const EXCLUDED_PATTERNS = [
    'node_modules',
    '.test.',
    '.spec.',
    '__tests__',
    'coverage',
];

/**
 * Recursively get all files from a directory that match the allowed extensions
 */
function getAllFiles(dir: string, files: string[] = []): string[] {
    try {
        const entries = readdirSync(dir);

        for (const entry of entries) {
            const fullPath = join(dir, entry);

            // Skip excluded patterns
            if (EXCLUDED_PATTERNS.some(pattern => fullPath.includes(pattern))) {
                continue;
            }

            try {
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    getAllFiles(fullPath, files);
                } else if (stat.isFile()) {
                    const ext = extname(entry);
                    if (ALLOWED_EXTENSIONS.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            } catch {
                // Skip files we can't access
                continue;
            }
        }
    } catch {
        // Skip directories we can't access
    }

    return files;
}

/**
 * Check a file for non-allowed px values
 */
function checkFileForPxValues(filePath: string): { line: number; content: string; pxValue: string }[] {
    const violations: { line: number; content: string; pxValue: string }[] = [];

    try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // Reset regex lastIndex for each line
            PX_PATTERN.lastIndex = 0;
            let match;

            while ((match = PX_PATTERN.exec(line)) !== null) {
                const pxValue = match[0];

                // Skip allowed values
                if (ALLOWED_PX_VALUES.has(pxValue)) {
                    continue;
                }

                // Skip comments (basic check for CSS and JS comments)
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('//') ||
                    trimmedLine.startsWith('/*') ||
                    trimmedLine.startsWith('*')) {
                    continue;
                }

                violations.push({
                    line: index + 1,
                    content: line.trim().slice(0, 100) + (line.trim().length > 100 ? '...' : ''),
                    pxValue,
                });
            }
        });
    } catch {
        // Skip files we can't read
    }

    return violations;
}

describe('Responsiveness Regression Test', () => {
    // Get the project root by going up from the test file location
    const projectRoot = join(__dirname, '..', '..');

    const allFiles: string[] = [];

    // Collect all files from scan directories
    for (const dir of SCAN_DIRECTORIES) {
        const fullDir = join(projectRoot, dir);
        getAllFiles(fullDir, allFiles);
    }

    it('should not have any non-allowed px values in CSS files', () => {
        const cssFiles = allFiles.filter(f => f.endsWith('.css'));
        const allViolations: { file: string; violations: { line: number; content: string; pxValue: string }[] }[] = [];

        for (const file of cssFiles) {
            const violations = checkFileForPxValues(file);
            if (violations.length > 0) {
                allViolations.push({
                    file: file.replace(projectRoot, ''),
                    violations,
                });
            }
        }

        if (allViolations.length > 0) {
            const errorMessages = allViolations.map(v =>
                `\n${v.file}:\n${v.violations.map(vv =>
                    `  Line ${vv.line}: ${vv.pxValue} - "${vv.content}"`
                ).join('\n')}`
            ).join('');

            fail(`Found ${allViolations.reduce((sum, v) => sum + v.violations.length, 0)} px value(s) that should be converted to rem:${errorMessages}`);
        }

        expect(allViolations.length).toBe(0);
    });

    it('should not have any non-allowed px values in TSX component files', () => {
        const tsxFiles = allFiles.filter(f => f.endsWith('.tsx'));
        const allViolations: { file: string; violations: { line: number; content: string; pxValue: string }[] }[] = [];

        for (const file of tsxFiles) {
            const violations = checkFileForPxValues(file);
            if (violations.length > 0) {
                allViolations.push({
                    file: file.replace(projectRoot, ''),
                    violations,
                });
            }
        }

        if (allViolations.length > 0) {
            const errorMessages = allViolations.map(v =>
                `\n${v.file}:\n${v.violations.map(vv =>
                    `  Line ${vv.line}: ${vv.pxValue} - "${vv.content}"`
                ).join('\n')}`
            ).join('');

            fail(`Found ${allViolations.reduce((sum, v) => sum + v.violations.length, 0)} px value(s) that should be converted to rem:${errorMessages}`);
        }

        expect(allViolations.length).toBe(0);
    });

    it('should have scanned files from all configured directories', () => {
        // Sanity check that we're actually scanning files
        expect(allFiles.length).toBeGreaterThan(0);

        // Log the count for visibility
        console.log(`Scanned ${allFiles.length} files for px values`);
    });
});
