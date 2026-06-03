import { execSync } from 'child_process';
import fs from 'fs';

/**
 * Stage 5: Manim Code Validator
 * 
 * Validates generated Python code BEFORE attempting to render.
 * Three-layer validation:
 *   1. Python Syntax Check (py_compile)
 *   2. Forbidden Pattern Detection (hallucination linting)
 *   3. Auto-Fix for common issues
 */

// Patterns that indicate LLM hallucinations
const FORBIDDEN_PATTERNS = [
    // 3D Objects
    { regex: /\bCube\s*\(/g, fix: 'Rectangle(', reason: '3D Cube not supported, use Rectangle' },
    { regex: /\bSphere\s*\(/g, fix: 'Circle(', reason: '3D Sphere not supported, use Circle' },
    { regex: /\bCone\s*\(/g, fix: null, reason: '3D Cone not supported' },
    { regex: /\bCylinder\s*\(/g, fix: null, reason: '3D Cylinder not supported' },
    { regex: /\bThreeDScene\b/g, fix: 'Scene', reason: 'ThreeDScene not supported, use Scene' },
    // Fake asset references
    { regex: /ImageMobject\s*\(\s*["'][^"']*["']\s*\)/g, fix: 'Dot(radius=0.5, color=WHITE)', reason: 'ImageMobject with file path not supported — use procedural shapes' },
    { regex: /SVGMobject\s*\(\s*["'](?!manim)[^"']*["']\s*\)/g, fix: 'Circle(radius=0.5)', reason: 'SVGMobject with custom file path not supported' },
    { regex: /["']path_to_\w+["']/g, fix: '"#1b1d2b"', reason: 'path_to_... placeholder is not a real asset' },
    // Hallucinated classes
    { regex: /\bStars\s*\(/g, fix: null, reason: 'Stars() does not exist — use Dot loops' },
    { regex: /\bCanvas\s*\(/g, fix: null, reason: 'Canvas() does not exist in Manim' },
    { regex: /\bCameraFlash\b/g, fix: 'Flash', reason: 'CameraFlash does not exist, use Flash' },
    { regex: /\bScaleUp\s*\(/g, fix: 'ScaleInPlace(', reason: 'ScaleUp does not exist' },
    { regex: /\bAlwaysRedraw\s*\(/g, fix: 'always_redraw(', reason: 'Use lowercase always_redraw()' },
    // Invalid attribute access
    { regex: /self\.duration/g, fix: '4', reason: 'self.duration does not exist, use a number' },
    { regex: /\.animate\.radius\s*\(/g, fix: '.animate.scale(', reason: '.animate.radius() is invalid' },
    // Table API misuse
    { regex: /Table\s*\(\s*headers\s*=/g, fix: null, reason: 'Table() does not accept headers= kwarg. Use Table([[...], [...]])' },
];

// Patterns for MathTex misuse (plain English in MathTex)
const MATHTEX_MISUSE = /MathTex\s*\(\s*["']([^"'\\]*[a-zA-Z ]{5,}[^"'\\]*)["']\s*\)/g;

/**
 * Layer 1: Python Syntax Check
 * Uses py_compile to verify the file has valid Python syntax.
 */
function checkSyntax(filePath) {
    try {
        execSync(`python -c "import py_compile; py_compile.compile('${filePath.replace(/\\/g, '/')}', doraise=True)"`, {
            stdio: 'pipe'
        });
        return { valid: true, error: null };
    } catch (err) {
        const stderr = err.stderr?.toString() || err.message;
        return { valid: false, error: stderr };
    }
}

/**
 * Layer 2: Forbidden Pattern Detection
 * Scans the code for known LLM hallucinations.
 */
function detectForbiddenPatterns(code) {
    const issues = [];
    for (const pattern of FORBIDDEN_PATTERNS) {
        const matches = code.match(pattern.regex);
        if (matches) {
            issues.push({
                pattern: pattern.regex.source,
                count: matches.length,
                reason: pattern.reason,
                fixable: pattern.fix !== null,
                fix: pattern.fix
            });
        }
    }

    // Check for MathTex misuse (plain English words in MathTex)
    let match;
    while ((match = MATHTEX_MISUSE.exec(code)) !== null) {
        issues.push({
            pattern: match[0],
            count: 1,
            reason: `MathTex used for plain text "${match[1]}". Use Text() instead.`,
            fixable: true,
            fix: `Text("${match[1]}")`
        });
    }

    return issues;
}

/**
 * Layer 3: Auto-Fix
 * Automatically fixes known hallucination patterns.
 */
function autoFix(code) {
    let fixedCode = code;
    let fixCount = 0;

    for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.fix) {
            const before = fixedCode;
            fixedCode = fixedCode.replace(pattern.regex, pattern.fix);
            if (before !== fixedCode) {
                fixCount++;
                console.log(`  [AutoFix] ${pattern.reason} → replaced with '${pattern.fix}'`);
            }
        }
    }

    // Fix MathTex misuse
    fixedCode = fixedCode.replace(MATHTEX_MISUSE, (match, content) => {
        fixCount++;
        console.log(`  [AutoFix] MathTex("${content}") → Text("${content}")`);
        return `Text("${content}")`;
    });

    // Fix duplicate keyword arguments (e.g., buff=0, buff=0.1)
    fixedCode = fixedCode.replace(/(\w+=\S+),\s*\1/g, (match, first) => {
        fixCount++;
        console.log(`  [AutoFix] Removed duplicate keyword argument`);
        return first;
    });

    return { fixedCode, fixCount };
}

/**
 * Main Validation Entry Point
 * Returns { valid, issues, fixedCode }
 */
export function validateManimCode(filePath) {
    console.log(`[Validator] Checking ${filePath}...`);
    const code = fs.readFileSync(filePath, 'utf-8');
    const results = { valid: true, issues: [], autoFixed: 0 };

    // Layer 0: Truncation Check (catches mid-stream cuts)
    if (code.trim().length < 100 || !code.includes('def construct')) {
        console.log(`  ❌ Truncation detected: file is too short or missing 'construct' method.`);
        results.valid = false;
        results.issues.push({ type: 'TRUNCATION', message: 'File appears truncated — response was cut off by token limit.' });
        return results;
    }

    // Layer 1: Syntax Check
    const syntax = checkSyntax(filePath);
    if (!syntax.valid) {
        console.log(`  ❌ Syntax Error: ${syntax.error}`);
        results.valid = false;
        results.issues.push({ type: 'SYNTAX', message: syntax.error });
        return results; // Cannot auto-fix syntax errors
    }
    console.log(`  ✅ Syntax OK`);

    // Layer 2: Pattern Detection
    const patterns = detectForbiddenPatterns(code);
    if (patterns.length > 0) {
        console.log(`  ⚠️  Found ${patterns.length} hallucination pattern(s):`);
        for (const p of patterns) {
            console.log(`     - ${p.reason} (${p.fixable ? 'auto-fixable' : 'MANUAL FIX NEEDED'})`);
        }
        results.issues.push(...patterns.map(p => ({ type: 'HALLUCINATION', ...p })));
    }

    // Layer 3: Auto-Fix
    const hasFixableIssues = patterns.some(p => p.fixable);
    if (hasFixableIssues) {
        const { fixedCode, fixCount } = autoFix(code);
        fs.writeFileSync(filePath, fixedCode);
        results.autoFixed = fixCount;
        console.log(`  🔧 Auto-fixed ${fixCount} issue(s). File updated.`);

        // Re-check syntax after auto-fix
        const recheck = checkSyntax(filePath);
        if (!recheck.valid) {
            console.log(`  ❌ Post-fix syntax check failed: ${recheck.error}`);
            results.valid = false;
            return results;
        }
    }

    // If only unfixable issues remain, mark as invalid
    const unfixable = patterns.filter(p => !p.fixable);
    if (unfixable.length > 0) {
        results.valid = false;
        console.log(`  ❌ ${unfixable.length} unfixable issue(s) remain. Regeneration needed.`);
    } else {
        console.log(`  ✅ Validation PASSED`);
    }

    return results;
}
