// Turns images (or a few letters) into ASCII art, rendered as text in a <pre>.

const RAMP = ' .,:;~-=+*#%@';
const FONT = '"JetBrains Mono Variable", ui-monospace, Menlo, monospace';
/** Glyph width divided by line height (0.6em wide glyphs, 1.2 line height). */
const CHAR_ASPECT = 0.5;

/** 'luma' follows the brightness of the image, 'alpha' only its shape (good for logos). */
export type AsciiMode = 'luma' | 'alpha';

interface Grid {
  cols: number;
  rows: number;
  luma: Float32Array;
  alpha: Float32Array;
}

const imageCache = new Map<string, Promise<Grid>>();

function sample(source: CanvasImageSource, width: number, height: number, cols: number): Grid {
  const rows = Math.max(1, Math.round(cols * (height / width) * CHAR_ASPECT));
  // Downscale in two steps; one big jump would alias on large photos.
  const mid = document.createElement('canvas');
  mid.width = cols * 4;
  mid.height = rows * 4;
  const midCtx = mid.getContext('2d')!;
  midCtx.imageSmoothingQuality = 'high';
  midCtx.drawImage(source, 0, 0, mid.width, mid.height);

  const out = document.createElement('canvas');
  out.width = cols;
  out.height = rows;
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(mid, 0, 0, cols, rows);

  const { data } = ctx.getImageData(0, 0, cols, rows);
  const luma = new Float32Array(cols * rows);
  const alpha = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    luma[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
    alpha[i] = data[i * 4 + 3] / 255;
  }
  return { cols, rows, luma, alpha };
}

function loadImageGrid(src: string, cols: number): Promise<Grid> {
  const key = `${src}@${cols}`;
  let grid = imageCache.get(key);
  if (!grid) {
    grid = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(sample(img, img.naturalWidth || 512, img.naturalHeight || 512, cols));
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
    imageCache.set(key, grid);
  }
  return grid;
}

async function textGrid(text: string, cols: number): Promise<Grid> {
  await document.fonts.load(`700 100px ${FONT}`).catch(() => undefined);
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;
  let size = 230;
  ctx.font = `700 ${size}px ${FONT}`;
  const width = ctx.measureText(text).width;
  if (width > canvas.width * 0.9) size *= (canvas.width * 0.9) / width;
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + size * 0.04);
  return sample(canvas, canvas.width, canvas.height, cols);
}

function toText(grid: Grid, mode: AsciiMode, invert: boolean): string {
  const { cols, rows, luma, alpha } = grid;
  const steps = RAMP.length - 1;
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      let d = mode === 'alpha' ? alpha[i] : alpha[i] * (invert ? 1 - luma[i] : luma[i]);
      d = Math.min(1, Math.max(0, (d - 0.5) * 1.12 + 0.5)) ** 0.95;
      line += RAMP[Math.round(d * steps)];
    }
    lines.push(line.trimEnd());
  }
  return lines.join('\n');
}

const reveals = new WeakMap<HTMLElement, number>();

/** Scans the art in from top to bottom, with a band of noise at the edge. */
function reveal(pre: HTMLElement, text: string) {
  const previous = reveals.get(pre);
  if (previous) cancelAnimationFrame(previous);
  const lines = text.split('\n');
  const band = 5;
  const duration = 900;
  const start = performance.now();
  const noise = (line: string) => line.replace(/\S/g, () => RAMP[1 + ((Math.random() * (RAMP.length - 1)) | 0)]);
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const edge = p * (lines.length + band);
    pre.textContent = lines.map((line, r) => (r < edge - band ? line : r < edge ? noise(line) : '')).join('\n');
    if (p < 1) reveals.set(pre, requestAnimationFrame(tick));
    else {
      reveals.delete(pre);
      pre.textContent = text;
    }
  };
  reveals.set(pre, requestAnimationFrame(tick));
}

/**
 * Fills a <figure class="ascii"> rendered by sections.ts.
 * `invert` is used in the light theme, so bright parts of a photo stay light on the light background.
 */
export async function hydrateAscii(fig: HTMLElement, opts: { invert: boolean; animate: boolean }) {
  const pre = fig.querySelector<HTMLElement>('pre');
  if (!pre) return;
  const cols = Number(fig.dataset.cols) || 64;
  const mode: AsciiMode = fig.dataset.mode === 'alpha' ? 'alpha' : 'luma';
  try {
    const grid = fig.dataset.src ? await loadImageGrid(fig.dataset.src, cols) : await textGrid(fig.dataset.text ?? '?', cols);
    fig.style.setProperty('--rows', String(grid.rows));
    const text = toText(grid, mode, opts.invert && mode === 'luma');
    if (opts.animate) reveal(pre, text);
    else pre.textContent = text;
  } catch (err) {
    console.warn(err);
    fig.classList.add('is-missing');
  }
}
