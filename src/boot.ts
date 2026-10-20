// The loading screen: a lit, spinning ASCII planet with procedural continents.

const RAMP = ' .,:;~=+*#%@';
const COLS = 48;
const ROWS = 24;
const LIGHT = normalize(-0.55, -0.5, 0.67);

function normalize(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

function hash(x: number, y: number, z: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function noise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = smooth(z - zi);
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return mix(
    mix(mix(c(0, 0, 0), c(1, 0, 0), u), mix(c(0, 1, 0), c(1, 1, 0), u), v),
    mix(mix(c(0, 0, 1), c(1, 0, 1), u), mix(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

function terrain(x: number, y: number, z: number): number {
  return 0.55 * noise(x, y, z) + 0.3 * noise(x * 2.1, y * 2.1, z * 2.1) + 0.15 * noise(x * 4.3, y * 4.3, z * 4.3);
}

export function planetFrame(angle: number): string {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const lines: string[] = [];
  for (let j = 0; j < ROWS; j++) {
    const y = ((j + 0.5) / ROWS) * 2 - 1;
    let line = '';
    for (let i = 0; i < COLS; i++) {
      const x = ((i + 0.5) / COLS) * 2 - 1;
      const r2 = x * x + y * y;
      if (r2 > 1) {
        line += ' ';
        continue;
      }
      const z = Math.sqrt(1 - r2);
      const light = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
      // Spin the surface, not the light, so the terminator stays put.
      const sx = x * cos + z * sin;
      const sz = z * cos - x * sin;
      const t = terrain(sx * 1.7 + 11, y * 1.7 + 11, sz * 1.7 + 11);
      const land = Math.min(1, Math.max(0, (t - 0.47) / 0.08));
      const b = Math.min(1, light * (0.28 + 0.72 * land) + 0.05);
      line += RAMP[Math.max(1, Math.round(b * (RAMP.length - 1)))];
    }
    lines.push(line.trimEnd());
  }
  return lines.join('\n');
}

/** Shows the loading screen until `ready` settles and at least `minMs` passed, then fades it out. */
export function runBoot(root: HTMLElement, art: HTMLElement, dots: HTMLElement, ready: Promise<unknown>, minMs = 1200): Promise<void> {
  root.hidden = false;
  const start = performance.now();
  let raf = 0;
  let last = 0;
  const loop = (now: number) => {
    if (now - last > 33) {
      last = now;
      art.textContent = planetFrame(((now - start) / 1000) * 0.9);
      dots.textContent = '.'.repeat(1 + (Math.floor((now - start) / 380) % 3));
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const minWait = new Promise((r) => setTimeout(r, minMs));
  return Promise.all([ready, minWait]).then(() => {
    root.classList.add('is-done');
    window.setTimeout(() => {
      cancelAnimationFrame(raf);
      root.hidden = true;
    }, 700);
  });
}
