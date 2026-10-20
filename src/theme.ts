// Light / dark theme, with a pixel-dissolve transition between them.

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const CELL = 28;
const PHASE_MS = 340;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Reads a CSS custom property for a theme without applying that theme. */
export function themeVar(name: string, theme: Theme = currentTheme()): string {
  const probe = document.createElement('div');
  probe.dataset.theme = theme;
  probe.style.display = 'none';
  document.body.append(probe);
  const value = getComputedStyle(probe).getPropertyValue(name).trim();
  probe.remove();
  return value;
}

function shuffled(n: number): Uint32Array {
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

/**
 * Covers the screen cell by cell in the new background color, swaps the theme underneath,
 * then uncovers it again in a different random order.
 */
export function switchTheme(next: Theme, wipe: HTMLCanvasElement, animate: boolean, onSwap: () => void): Promise<void> {
  const apply = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this visit.
    }
    onSwap();
  };
  if (!animate) {
    apply();
    return Promise.resolve();
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cols = Math.ceil(w / CELL);
  const total = cols * Math.ceil(h / CELL);
  const cover = shuffled(total);
  const uncover = shuffled(total);
  wipe.width = Math.round(w * dpr);
  wipe.height = Math.round(h * dpr);
  wipe.style.display = 'block';
  const ctx = wipe.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = themeVar('--bg', next);
  const fill = (order: Uint32Array, from: number, to: number) => {
    for (let i = from; i < to; i++) {
      const k = order[i];
      ctx.fillRect((k % cols) * CELL, Math.floor(k / cols) * CELL, CELL + 1, CELL + 1);
    }
  };

  return new Promise((resolve) => {
    const start = performance.now();
    let covered = 0;
    let swapped = false;
    const tick = (now: number) => {
      const t = now - start;
      if (t < PHASE_MS) {
        const target = Math.floor((t / PHASE_MS) * total);
        fill(cover, covered, target);
        covered = target;
        requestAnimationFrame(tick);
        return;
      }
      if (!swapped) {
        fill(cover, covered, total);
        apply();
        swapped = true;
      }
      const p = Math.min(1, (t - PHASE_MS) / PHASE_MS);
      ctx.clearRect(0, 0, w, h);
      fill(uncover, Math.floor(p * total), total);
      if (p < 1) requestAnimationFrame(tick);
      else {
        wipe.style.display = 'none';
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}
