import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

/** Short commit hash shown in the bottom-left corner of the site. */
function buildSha(): string {
  const fromCi = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? process.env.CF_PAGES_COMMIT_SHA;
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}

/**
 * Absolute site address for link previews (og:image must be a full URL).
 * SITE_URL wins if set; on Vercel the project's production domain is used, custom domain included.
 * Locally it is empty, so the tags fall back to relative paths.
 */
function siteUrl(): string {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : '';
}

export default defineConfig({
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha()),
  },
  plugins: [
    {
      name: 'site-url',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => html.replaceAll('%SITE_URL%', siteUrl()),
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
