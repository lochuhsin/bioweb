// Runs after `vite build`:
// 1. Copies index.html to 404.html so deep links like /about work on GitHub Pages.
// 2. Ships the fonts' SIL Open Font License files next to the bundled fonts.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));

const fonts = ['jetbrains-mono', 'work-sans', 'instrument-sans'];
mkdirSync(join(dist, 'licenses'), { recursive: true });
for (const font of fonts) {
  const license = join(root, 'node_modules', '@fontsource-variable', font, 'LICENSE');
  if (existsSync(license)) copyFileSync(license, join(dist, 'licenses', `${font}-OFL.txt`));
}
