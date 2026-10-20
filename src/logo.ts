// The small mark in the top-left corner: a tilted wireframe globe that slowly turns.
// Swap it for your own logo by replacing the <canvas> in index.html with an <img> or <svg>.

const TAU = Math.PI * 2;
const SIZE = 36;

export interface Logo {
  setColor(color: string): void;
  setPaused(paused: boolean): void;
}

export function startLogo(canvas: HTMLCanvasElement, color: string): Logo {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  const ctx = canvas.getContext('2d')!;
  let stroke = color;
  let paused = false;
  let angle = 0.5;
  let last = performance.now();
  let raf = 0;

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    const c = SIZE / 2;
    const r = SIZE / 2 - 1.5;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, TAU);
    ctx.stroke();
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(-0.4);
    for (const lat of [-0.5, 0, 0.5]) {
      const rx = r * Math.sqrt(1 - lat * lat);
      ctx.beginPath();
      ctx.ellipse(0, lat * r, rx, rx * 0.3, 0, 0, TAU);
      ctx.stroke();
    }
    for (let k = 0; k < 2; k++) {
      const rx = Math.abs(Math.cos(angle + (k * Math.PI) / 2)) * r;
      if (rx < 0.6) continue;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, r, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  };

  const loop = (now: number) => {
    raf = 0;
    if (now - last > 33) {
      angle += ((now - last) / 1000) * 0.7;
      last = now;
      draw();
    }
    if (!paused && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (raf || paused || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };

  document.addEventListener('visibilitychange', wake);
  draw();
  wake();

  return {
    setColor(next) {
      stroke = next;
      draw();
    },
    setPaused(next) {
      paused = next;
      wake();
    },
  };
}
