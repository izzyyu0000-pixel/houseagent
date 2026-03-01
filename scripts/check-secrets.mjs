import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  '.firebase',
]);

const EXCLUDED_FILE_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.lock',
]);

const EXCLUDED_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
]);

const CHECKABLE_EXTS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.css',
  '.html',
  '.md',
  '.yml',
  '.yaml',
  '.toml',
  '.env',
  '',
]);

const SECRET_PATTERNS = [
  { name: 'Firebase API key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Generic private key', regex: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g },
  { name: 'GitHub token', regex: /\bghp_[0-9A-Za-z]{36}\b/g },
  { name: 'Google OAuth client secret', regex: /"client_secret"\s*:\s*"[^"]+"/g },
  { name: 'Slack token', regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
];

const findings = [];

function shouldSkipDir(dirent) {
  return dirent.isDirectory() && EXCLUDED_DIRS.has(dirent.name);
}

function shouldCheckFile(filePath) {
  const base = path.basename(filePath);
  if (EXCLUDED_BASENAMES.has(base)) return false;
  if (base.startsWith('.env.')) return false;

  const ext = path.extname(filePath).toLowerCase();
  if (EXCLUDED_FILE_EXTS.has(ext)) return false;
  return CHECKABLE_EXTS.has(ext);
}

function walk(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldSkipDir(entry)) continue;

    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath);
      continue;
    }

    if (!entry.isFile() || !shouldCheckFile(absolutePath)) {
      continue;
    }

    const raw = fs.readFileSync(absolutePath, 'utf8');
    for (const { name, regex } of SECRET_PATTERNS) {
      const matches = raw.match(regex);
      if (!matches) continue;

      findings.push({
        file: path.relative(ROOT, absolutePath),
        pattern: name,
        sample: matches[0].slice(0, 16) + '...',
      });
    }
  }
}

walk(ROOT);

if (findings.length > 0) {
  console.error('Secret scan failed. Potential secrets found:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.pattern} (${finding.sample})`);
  }
  process.exit(1);
}

console.log('Secret scan passed. No known secret patterns found.');
