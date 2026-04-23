/**
 * Auto-fix missing dark: Tailwind classes across all .tsx files.
 *
 * For each light-mode-only class, inserts the corresponding dark: variant
 * right after it — but ONLY if no dark: variant already exists on the same
 * className string (to avoid double-adding).
 *
 * Usage:  node scripts/fix-dark-mode.js
 *         node scripts/fix-dark-mode.js --dry-run   (preview only)
 */
const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');

const DRY_RUN = process.argv.includes('--dry-run');

// Each rule: [regex to find, replacement includes original + dark variant]
// The regex matches the light class only when NOT already followed by dark: on the same token boundary.
const RULES = [
  // ── Text colors ──
  ['text-gray-900',  'text-gray-900 dark:text-white'],
  ['text-gray-800',  'text-gray-800 dark:text-gray-200'],
  ['text-gray-700',  'text-gray-700 dark:text-gray-300'],
  ['text-gray-600',  'text-gray-600 dark:text-gray-400'],
  ['text-red-700',   'text-red-700 dark:text-red-400'],
  ['text-red-600',   'text-red-600 dark:text-red-400'],
  ['text-green-700', 'text-green-700 dark:text-green-400'],
  ['text-green-600', 'text-green-600 dark:text-green-400'],
  ['text-green-800', 'text-green-800 dark:text-green-300'],
  ['text-yellow-800','text-yellow-800 dark:text-yellow-300'],
  ['text-yellow-700','text-yellow-700 dark:text-yellow-300'],
  ['text-yellow-600','text-yellow-600 dark:text-yellow-400'],
  ['text-blue-700',  'text-blue-700 dark:text-blue-400'],
  ['text-blue-600',  'text-blue-600 dark:text-blue-400'],

  // ── Background colors ──
  ['bg-white',       'bg-white dark:bg-gray-800'],
  ['bg-gray-50',     'bg-gray-50 dark:bg-gray-900'],
  ['bg-gray-100',    'bg-gray-100 dark:bg-gray-700'],
  ['bg-red-50',      'bg-red-50 dark:bg-red-900/30'],
  ['bg-red-100',     'bg-red-100 dark:bg-red-900/40'],
  ['bg-green-50',    'bg-green-50 dark:bg-green-900/30'],
  ['bg-green-100',   'bg-green-100 dark:bg-green-900/40'],
  ['bg-yellow-50',   'bg-yellow-50 dark:bg-yellow-900/30'],
  ['bg-yellow-100',  'bg-yellow-100 dark:bg-yellow-900/40'],
  ['bg-blue-50',     'bg-blue-50 dark:bg-blue-900/30'],
  ['bg-blue-100',    'bg-blue-100 dark:bg-blue-900/40'],

  // ── Border colors ──
  ['border-gray-200','border-gray-200 dark:border-gray-700'],
  ['border-gray-300','border-gray-300 dark:border-gray-600'],
  ['border-gray-100','border-gray-100 dark:border-gray-800'],
  ['border-red-200', 'border-red-200 dark:border-red-800'],
  ['border-red-300', 'border-red-300 dark:border-red-700'],
  ['border-green-200','border-green-200 dark:border-green-800'],
  ['border-green-300','border-green-300 dark:border-green-700'],
  ['border-yellow-200','border-yellow-200 dark:border-yellow-800'],
  ['border-yellow-300','border-yellow-300 dark:border-yellow-700'],
  ['border-blue-100','border-blue-100 dark:border-blue-800'],
  ['border-blue-200','border-blue-200 dark:border-blue-800'],

  // ── Hover states ──
  ['hover:bg-gray-50',  'hover:bg-gray-50 dark:hover:bg-gray-700'],
  ['hover:bg-gray-100', 'hover:bg-gray-100 dark:hover:bg-gray-700'],
  ['hover:bg-red-50',   'hover:bg-red-50 dark:hover:bg-red-900/30'],
  ['hover:bg-red-100',  'hover:bg-red-100 dark:hover:bg-red-900/40'],
  ['hover:text-gray-700','hover:text-gray-700 dark:hover:text-gray-300'],
  ['hover:text-gray-900','hover:text-gray-900 dark:hover:text-white'],

  // ── Disabled states ──
  ['disabled:bg-gray-100','disabled:bg-gray-100 dark:disabled:bg-gray-700'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;

  for (const [lightClass, replacement] of RULES) {
    // Build a regex that matches the light class but NOT when dark: variant is
    // already adjacent (within the same string/line). We check that the class
    // is NOT immediately preceded by "dark:" and NOT already followed by " dark:".
    //
    // Strategy: match the exact class as a whole word, then look ahead to ensure
    // no dark: variant of the same category exists nearby on the same line.

    const darkPrefix = 'dark:' + lightClass.split('-')[0]; // e.g. "dark:text" or "dark:bg"
    const escaped = lightClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match the light class as a whole word (bounded by whitespace, quotes, backticks, or start/end)
    const regex = new RegExp(
      `(?<![\\w:-])${escaped}(?![\\w-])`,
      'g'
    );

    // Process line by line so we can check if dark: already exists on that line
    const lines = content.split('\n');
    let fileChanged = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip if line already has the dark variant
      if (line.includes(darkPrefix)) continue;
      // Skip if line is a comment
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      // Skip imports
      if (line.trimStart().startsWith('import ')) continue;

      const newLine = line.replace(regex, replacement);
      if (newLine !== line) {
        lines[i] = newLine;
        fileChanged = true;
        changeCount++;
      }
    }
    if (fileChanged) {
      content = lines.join('\n');
    }
  }

  if (changeCount > 0 && !DRY_RUN) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return changeCount;
}

async function main() {
  const srcDir = path.resolve(__dirname, '../src');
  const files = await glob('**/*.tsx', { cwd: srcDir, absolute: true });

  console.log(`Scanning ${files.length} .tsx files...`);
  if (DRY_RUN) console.log('(DRY RUN — no files will be modified)\n');

  let totalChanges = 0;
  const results = [];

  for (const file of files) {
    const count = processFile(file);
    if (count > 0) {
      const rel = path.relative(srcDir, file);
      results.push({ file: rel, count });
      totalChanges += count;
    }
  }

  results.sort((a, b) => b.count - a.count);
  for (const r of results) {
    console.log(`  ${r.count.toString().padStart(3)} fixes  ${r.file}`);
  }

  console.log(`\n${DRY_RUN ? 'Would fix' : 'Fixed'} ${totalChanges} instances across ${results.length} files.`);
}

main().catch(console.error);
