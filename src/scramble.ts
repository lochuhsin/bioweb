// Text that assembles itself out of random glyphs, one character at a time.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\|[]{}?!';
const SCRAMBLE_MS = 240;

let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setScrambleReducedMotion(reduced: boolean) {
  reducedMotion = reduced;
}

export const randomGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

interface Cell {
  display: HTMLSpanElement;
  ch: string;
  at: number;
}

const running = new WeakMap<HTMLElement, number>();

export interface ScrambleOptions {
  /** ms before the first character starts settling */
  delay?: number;
  /** ms between neighbouring characters */
  stagger?: number;
  /** random extra ms per character, so the text does not settle in a strict line */
  jitter?: number;
}

/**
 * Replaces the element's text with `text`, revealing it through random glyphs.
 * Each character keeps the width of its final glyph, so the layout never jumps.
 * Screen readers get the final text right away.
 */
export function scrambleText(el: HTMLElement, text: string, opts: ScrambleOptions = {}): Promise<void> {
  const previous = running.get(el);
  if (previous) cancelAnimationFrame(previous);
  running.delete(el);

  if (reducedMotion || !text.trim()) {
    el.textContent = text;
    return Promise.resolve();
  }

  const { delay = 0, stagger = 32, jitter = 220 } = opts;
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');

  const cells: Cell[] = [];
  text.split(' ').forEach((word, wi) => {
    if (wi > 0) visual.append(' ');
    const wordEl = document.createElement('span');
    wordEl.className = 'g-word';
    for (const ch of word) {
      const glyph = document.createElement('span');
      glyph.className = 'g';
      const measure = document.createElement('span');
      measure.className = 'g-m';
      measure.textContent = ch;
      const display = document.createElement('span');
      display.className = 'g-d';
      glyph.append(measure, display);
      wordEl.append(glyph);
      cells.push({ display, ch, at: delay + SCRAMBLE_MS + cells.length * stagger + Math.random() * jitter });
    }
    visual.append(wordEl);
  });
  el.replaceChildren(sr, visual);

  return new Promise((resolve) => {
    const start = performance.now();
    let lastSwap = 0;
    const tick = (now: number) => {
      const t = now - start;
      const swap = now - lastSwap > 50;
      if (swap) lastSwap = now;
      let done = true;
      for (const cell of cells) {
        if (t >= cell.at) {
          if (cell.display.textContent !== cell.ch) cell.display.textContent = cell.ch;
        } else if (t >= cell.at - SCRAMBLE_MS) {
          done = false;
          if (swap) cell.display.textContent = randomGlyph();
        } else {
          done = false;
        }
      }
      if (done) {
        running.delete(el);
        el.textContent = text;
        resolve();
        return;
      }
      running.set(el, requestAnimationFrame(tick));
    };
    running.set(el, requestAnimationFrame(tick));
  });
}
