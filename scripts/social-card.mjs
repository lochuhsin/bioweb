// Screenshots social-card.html into public/social-card.png (the link-preview image) with headless Chrome.
// usage: npm run dev   (in another terminal), then:  npm run social-card [-- http://localhost:5173]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/+$/, '');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = fileURLToPath(new URL('../public/social-card.png', import.meta.url));
// Chrome would happily screenshot an error page, so make sure the dev server answers first.
try {
  const res = await fetch(`${base}/social-card.html`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (err) {
  console.error(`Could not reach ${base}/social-card.html (${err.message}). Start it with: npm run dev`);
  process.exit(1);
}

// A throwaway profile, so your own Chrome profile is never touched.
const profile = mkdtempSync(join(tmpdir(), 'social-card-'));

try {
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    '--virtual-time-budget=6000',
    `--user-data-dir=${profile}`,
    `--screenshot=${out}`,
    `${base}/social-card.html`,
  ], { stdio: 'inherit' });
  console.log(`wrote ${out}`);
} finally {
  rmSync(profile, { recursive: true, force: true });
}
