// The home screen: clouds of drifting glyphs joined by dotted links, drawn on one canvas.
// Each cloud also gets a real <a> on top of it, so keyboards, screen readers and crawlers see links.

import type { SectionId, WorldNode } from './content';
import { scrambleText } from './scramble';

const CLOUD_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*+=-~<>/\\|[]{}()?!;:^@';
const DOT = '·';
const BITS = '01';
const FONT = '"JetBrains Mono Variable", ui-monospace, Menlo, monospace';

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = (chars: string) => chars[(Math.random() * chars.length) | 0];
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Pre-renders every glyph once, so a frame is a few thousand cheap drawImage calls instead of fillText calls. */
class GlyphAtlas {
  private readonly canvas = document.createElement('canvas');
  private readonly index = new Map<string, number>();
  private readonly base: number;
  private readonly cell: number;
  private readonly unit: number;
  private readonly cols = 16;

  constructor(chars: string, base: number, scale: number, color: string) {
    const glyphs = [...new Set(chars)];
    const px = Math.ceil(base * scale);
    this.base = base;
    this.cell = Math.ceil(px * 1.4);
    this.unit = 1 / scale;
    this.canvas.width = this.cols * this.cell;
    this.canvas.height = Math.ceil(glyphs.length / this.cols) * this.cell;
    const ctx = this.canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.font = `500 ${px}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    glyphs.forEach((ch, i) => {
      this.index.set(ch, i);
      ctx.fillText(ch, ((i % this.cols) + 0.5) * this.cell, (Math.floor(i / this.cols) + 0.5) * this.cell);
    });
  }

  /** Draws `ch` centred on (x, y) at a font size of `size` CSS pixels. */
  draw(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, size: number) {
    const i = this.index.get(ch);
    if (i === undefined) return;
    const d = this.cell * this.unit * (size / this.base);
    const sx = (i % this.cols) * this.cell;
    const sy = Math.floor(i / this.cols) * this.cell;
    ctx.drawImage(this.canvas, sx, sy, this.cell, this.cell, x - d / 2, y - d / 2, d, d);
  }
}

interface Particle {
  /** Resting position inside the unit disk; scaled by the cloud's radii when drawn. */
  u: number;
  v: number;
  phase: number;
  speed: number;
  amp: number;
  ch: string;
  ttl: number;
  size: number;
  alpha: number;
  /** Intro: start offset from the cloud centre and stagger. */
  sx: number;
  sy: number;
  delay: number;
}

interface Cloud {
  node: WorldNode;
  index: number;
  el: HTMLAnchorElement;
  label: HTMLSpanElement;
  x: number;
  y: number;
  rx: number;
  ry: number;
  seed: number;
  rot: number;
  hover: number;
  hoverTarget: number;
  particles: Particle[];
}

interface Star {
  x: number;
  y: number;
  z: number;
  ch: string;
  ttl: number;
  size: number;
  alpha: number;
  phase: number;
}

interface Link {
  a: Cloud;
  b: Cloud;
  bend: number;
  /** Brightness of this strand; the main strand of a pair is 1, the side strands fainter. */
  weight: number;
  packets: { t: number; speed: number; ch: string }[];
}

/**
 * Every pair of linked clouds gets a bundle of arcs: [extra bend, brightness, packets of 0/1 in flight].
 * Add or remove rows for a denser or sparser network.
 */
const STRANDS: [number, number, number][] = [
  [0, 1, 3],
  [0.12, 0.6, 2],
  [-0.1, 0.5, 2],
  [0.24, 0.32, 1],
];

interface Camera {
  x: number;
  y: number;
  s: number;
}

function makeParticles(count: number): Particle[] {
  // A wobbly outline, so the clouds look grown rather than stamped out.
  const w1 = rand(0, TAU);
  const w2 = rand(0, TAU);
  return Array.from({ length: count }, () => {
    const angle = rand(0, TAU);
    const outline = 1 + 0.12 * Math.sin(3 * angle + w1) + 0.07 * Math.sin(5 * angle + w2);
    const stray = Math.random() < 0.06;
    const r = stray ? rand(1.02, 1.35) : Math.sqrt(Math.random());
    return {
      u: Math.cos(angle) * r * outline,
      v: Math.sin(angle) * r * outline,
      phase: rand(0, TAU),
      speed: rand(0.3, 1.1),
      amp: rand(0.6, 2.6),
      ch: pick(CLOUD_GLYPHS),
      ttl: rand(0.2, 4.5),
      size: rand(9.5, 13.5),
      alpha: stray ? rand(0.15, 0.4) : rand(0.35, 0.95) * (1 - 0.35 * r),
      sx: 0,
      sy: 0,
      delay: rand(0, 0.45),
    };
  });
}

const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

/** Distance from an ellipse's centre to its edge in direction `angle`. */
const edgeRadius = (c: Cloud, angle: number) => (c.rx * c.ry) / Math.hypot(c.ry * Math.cos(angle), c.rx * Math.sin(angle));

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  layer: HTMLElement;
  nodes: WorldNode[];
  color: string;
}

export class World {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly layer: HTMLElement;
  private readonly clouds: Cloud[];
  private stars: Star[] = [];
  private links: Link[] = [];
  private atlas: GlyphAtlas | null = null;
  private color: string;

  private w = 0;
  private h = 0;
  private dpr = 0;

  private cam: Camera = { x: 0, y: 0, s: 1 };
  private camFrom: Camera = { x: 0, y: 0, s: 1 };
  private camTo: Camera = { x: 0, y: 0, s: 1 };
  private camStart = 0;
  private camDuration = 0;
  private focused: Cloud | null = null;

  private intro: 'waiting' | 'running' | 'done' = 'waiting';
  private introStart = 0;
  private readonly introDuration = 1800;

  private readonly pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private time = 0;
  private last = 0;
  private raf = 0;
  private frame = 0;
  private resizeRaf = 0;
  private paused = false;
  private reduced = false;
  private dimmed = false;

  constructor(opts: WorldOptions) {
    this.canvas = opts.canvas;
    this.ctx = opts.canvas.getContext('2d')!;
    this.layer = opts.layer;
    this.color = opts.color;
    this.clouds = opts.nodes.map((node, index) => this.createCloud(node, index));
    this.resize();

    window.addEventListener('resize', () => {
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.resize());
    });
    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        this.pointer.tx = (e.clientX / this.w) * 2 - 1;
        this.pointer.ty = (e.clientY / this.h) * 2 - 1;
        this.wake();
      },
      { passive: true },
    );
    document.addEventListener('visibilitychange', () => this.wake());
  }

  // --- public API ----------------------------------------------------------

  /** Glyphs fly in from all over the screen and settle into clouds. */
  startIntro(instant: boolean) {
    if (instant || this.reduced) {
      this.intro = 'done';
      this.layer.classList.add('is-ready');
      this.wake();
      return;
    }
    for (const c of this.clouds) {
      for (const p of c.particles) {
        p.sx = rand(0, this.w) - c.x;
        p.sy = rand(0, this.h) - c.y;
      }
    }
    this.intro = 'running';
    this.introStart = performance.now();
    window.setTimeout(() => {
      this.layer.classList.add('is-ready');
      this.clouds.forEach((c, i) => scrambleText(c.label, c.node.label, { delay: i * 90 }));
    }, this.introDuration * 0.5);
    this.wake();
  }

  /** Zooms into a cloud. Returns how long the camera move takes, in ms. */
  focus(id: SectionId, instant = false): number {
    const cloud = this.clouds.find((c) => c.node.id === id);
    if (!cloud) return 0;
    this.focused = cloud;
    for (const c of this.clouds) c.hoverTarget = 0;
    this.layer.classList.add('is-hidden');
    return this.moveCamera(this.focusCamera(cloud), instant);
  }

  unfocus(instant = false): number {
    this.focused = null;
    this.layer.classList.remove('is-hidden');
    return this.moveCamera(this.homeCamera(), instant);
  }

  /** Blurs and fades the world behind a section page (see .world.is-dimmed in styles.css). */
  setDimmed(on: boolean) {
    this.dimmed = on;
    this.canvas.parentElement?.classList.toggle('is-dimmed', on);
  }

  setColor(color: string) {
    this.color = color;
    this.buildAtlas();
    this.draw(performance.now());
    this.wake();
  }

  /** Re-renders the glyphs, e.g. once the web font has loaded. */
  refreshGlyphs() {
    this.buildAtlas();
    this.wake();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.wake();
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
    this.wake();
  }

  // --- setup ---------------------------------------------------------------

  private createCloud(node: WorldNode, index: number): Cloud {
    const el = document.createElement('a');
    el.className = 'node';
    el.href = `/${node.id}`;
    el.dataset.link = '';
    const label = document.createElement('span');
    label.className = 'node-label';
    label.textContent = node.label;
    el.append(label);
    this.layer.append(el);

    const cloud: Cloud = {
      node,
      index,
      el,
      label,
      x: 0,
      y: 0,
      rx: 0,
      ry: 0,
      seed: Math.random(),
      rot: rand(0, TAU),
      hover: 0,
      hoverTarget: 0,
      particles: [],
    };
    const enter = () => {
      if (!this.focused) cloud.hoverTarget = 1;
      this.wake();
    };
    const leave = () => {
      cloud.hoverTarget = 0;
      this.wake();
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('focus', enter);
    el.addEventListener('blur', leave);
    return cloud;
  }

  private resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const dprChanged = dpr !== this.dpr;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.layout();
    this.stars = this.createStars();
    this.links = this.createLinks();
    if (dprChanged || !this.atlas) this.buildAtlas();
    this.cam = this.focused ? this.focusCamera(this.focused) : this.homeCamera();
    this.camDuration = 0;
    this.draw(performance.now());
    this.wake();
  }

  private layout() {
    const mobile = this.w < 720;
    const top = mobile ? 112 : 84;
    const bottom = mobile ? 48 : 56;
    const side = mobile ? 14 : 28;
    const n = this.clouds.length;
    const base = mobile ? clamp(this.w * 0.3, 92, 132) : clamp(Math.min(this.w * 0.14, this.h * 0.2), 105, 190);
    for (const c of this.clouds) {
      c.rx = base;
      c.ry = base * 0.56;
      const [nx, ny] = mobile ? [c.index % 2 === 0 ? 0.3 : 0.7, n === 1 ? 0.5 : c.index / (n - 1)] : c.node.position;
      c.x = side + c.rx + nx * Math.max(0, this.w - 2 * (side + c.rx));
      c.y = top + c.ry + ny * Math.max(0, this.h - top - bottom - 2 * c.ry);

      const want = Math.round(clamp((c.rx * c.ry) / 12600, 0.45, 1.6) * 250);
      if (Math.abs(want - c.particles.length) > want * 0.25) c.particles = makeParticles(want);

      const s = c.el.style;
      s.left = `${c.x}px`;
      s.top = `${c.y}px`;
      s.width = `${c.rx * 2}px`;
      s.height = `${c.ry * 2}px`;
    }
  }

  private createStars(): Star[] {
    const count = Math.round(clamp((this.w * this.h) / 7000, 60, 320));
    return Array.from({ length: count }, () => ({
      x: rand(-0.05, 1.05) * this.w,
      y: rand(-0.05, 1.05) * this.h,
      z: rand(0.2, 1),
      ch: pick(CLOUD_GLYPHS),
      ttl: rand(1, 8),
      size: rand(8, 12),
      alpha: rand(0.04, 0.16),
      phase: rand(0, TAU),
    }));
  }

  /** Joins every cloud to its two nearest neighbours. */
  private createLinks(): Link[] {
    const seen = new Set<string>();
    const links: Link[] = [];
    const dist = (a: Cloud, b: Cloud) => Math.hypot(a.x - b.x, a.y - b.y);
    for (const a of this.clouds) {
      const nearest = this.clouds
        .filter((b) => b !== a)
        .sort((p, q) => dist(a, p) - dist(a, q))
        .slice(0, 2);
      for (const b of nearest) {
        const key = a.index < b.index ? `${a.index}-${b.index}` : `${b.index}-${a.index}`;
        if (seen.has(key)) continue;
        // Alternate which side each bundle bows towards, so neighbouring bundles don't overlap.
        const side = seen.size % 2 ? 1 : -1;
        seen.add(key);
        for (const [extra, weight, packets] of STRANDS) {
          links.push({
            a,
            b,
            bend: side * (0.14 + extra),
            weight,
            packets: Array.from({ length: packets }, () => ({
              t: Math.random(),
              speed: rand(0.05, 0.14) * (Math.random() < 0.5 ? 1 : -1),
              ch: pick(BITS),
            })),
          });
        }
      }
    }
    return links;
  }

  private buildAtlas() {
    this.atlas = new GlyphAtlas(CLOUD_GLYPHS + DOT + BITS, 12, this.dpr * 2, this.color);
  }

  // --- camera --------------------------------------------------------------

  private homeCamera(): Camera {
    return { x: this.w / 2, y: this.h / 2, s: 1 };
  }

  /** Close enough that the cloud fills the screen and its glyphs turn into big, soft shapes. */
  private focusCamera(c: Cloud): Camera {
    const s = clamp(Math.max(this.w / (c.rx * 2.2), this.h / (c.ry * 2.2)), 2.2, 4.2);
    return { x: c.x, y: c.y, s };
  }

  private moveCamera(to: Camera, instant: boolean): number {
    if (instant || this.reduced) {
      this.cam = to;
      this.camDuration = 0;
      this.wake();
      return 0;
    }
    this.camFrom = { ...this.cam };
    this.camTo = to;
    this.camStart = performance.now();
    this.camDuration = 1150;
    this.wake();
    return this.camDuration;
  }

  // --- loop ----------------------------------------------------------------

  private wake() {
    if (this.raf || document.hidden) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number) => {
    this.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const busy = this.update(dt, now);
    this.frame++;
    // Behind a section page the world is blurred, so 30 fps is plenty.
    if (!(this.dimmed && this.camDuration === 0 && this.frame % 2)) this.draw(now);
    if (busy && !document.hidden) this.raf = requestAnimationFrame(this.tick);
  };

  /** Advances the simulation. Returns whether another frame is needed. */
  private update(dt: number, now: number): boolean {
    const still = this.paused || this.reduced;
    const step = still ? 0 : dt;
    this.time += step;
    let busy = !still || this.intro === 'running';

    if (this.camDuration > 0) {
      const p = clamp((now - this.camStart) / this.camDuration, 0, 1);
      const e = easeInOut(p);
      this.cam = {
        x: lerp(this.camFrom.x, this.camTo.x, e),
        y: lerp(this.camFrom.y, this.camTo.y, e),
        s: this.camFrom.s * (this.camTo.s / this.camFrom.s) ** e,
      };
      if (p >= 1) this.camDuration = 0;
      busy = true;
    }

    // Mouse parallax, home screen only.
    const parallax = !this.focused && !still;
    const tx = parallax ? this.pointer.tx : 0;
    const ty = parallax ? this.pointer.ty : 0;
    const k = 1 - Math.exp(-dt * 3);
    this.pointer.x += (tx - this.pointer.x) * k;
    this.pointer.y += (ty - this.pointer.y) * k;
    if (Math.abs(tx - this.pointer.x) + Math.abs(ty - this.pointer.y) > 0.002) busy = true;

    const hk = 1 - Math.exp(-dt * 7);
    for (const c of this.clouds) {
      c.hover += (c.hoverTarget - c.hover) * hk;
      if (Math.abs(c.hoverTarget - c.hover) > 0.002) busy = true;
      c.rot += step * (0.04 + 0.45 * c.hover);
      const flicker = step * (1 + 6 * c.hover);
      for (const p of c.particles) {
        p.ttl -= flicker;
        if (p.ttl <= 0) {
          p.ch = pick(CLOUD_GLYPHS);
          p.ttl = rand(0.6, 4.5);
        }
      }
    }
    for (const s of this.stars) {
      s.ttl -= step;
      if (s.ttl <= 0) {
        s.ch = pick(CLOUD_GLYPHS);
        s.ttl = rand(2, 9);
      }
    }
    for (const l of this.links) {
      for (const pk of l.packets) pk.t = (((pk.t + step * pk.speed) % 1) + 1) % 1;
    }
    return busy;
  }

  private introProgress(now: number): number {
    if (this.intro === 'waiting') return 0;
    if (this.intro === 'done') return 1;
    const p = clamp((now - this.introStart) / this.introDuration, 0, 1);
    if (p >= 1) this.intro = 'done';
    return p;
  }

  // --- drawing -------------------------------------------------------------

  private draw(now: number) {
    const { ctx, atlas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const ip = this.introProgress(now);
    if (!atlas || ip <= 0) return;

    const { x, y, s } = this.cam;
    const d = this.dpr;
    ctx.setTransform(d * s, 0, 0, d * s, d * (this.w / 2 - x * s), d * (this.h / 2 - y * s));
    const px = this.pointer.x * 16;
    const py = this.pointer.y * 11;

    const starFade = clamp(ip * 2, 0, 1);
    for (const st of this.stars) {
      ctx.globalAlpha = st.alpha * (0.65 + 0.35 * Math.sin(this.time * 0.8 + st.phase)) * starFade;
      atlas.draw(ctx, st.ch, st.x - px * st.z, st.y - py * st.z, st.size);
    }

    const linkFade = clamp((ip - 0.45) / 0.4, 0, 1);
    if (linkFade > 0) for (const l of this.links) this.drawLink(atlas, l, linkFade, px, py);
    for (const c of this.clouds) this.drawCloud(atlas, c, ip, px, py);
    ctx.globalAlpha = 1;
  }

  private drawCloud(atlas: GlyphAtlas, c: Cloud, ip: number, px: number, py: number) {
    const { ctx } = this;
    const breath = 1 + 0.025 * Math.sin(this.time * 0.8 + c.seed * TAU) + 0.07 * c.hover;
    const cos = Math.cos(c.rot);
    const sin = Math.sin(c.rot);
    const cx = c.x - px * 0.5;
    const cy = c.y - py * 0.5;
    // Keep the label readable by thinning out the glyphs right behind it.
    const labelW = c.node.label.length * 4.9 + 10;
    const labelH = 11;
    const boost = 1 + 0.6 * c.hover;

    for (const p of c.particles) {
      const u = p.u * cos - p.v * sin;
      const v = p.u * sin + p.v * cos;
      const drift = this.time * p.speed + p.phase;
      let x = u * c.rx * breath + Math.sin(drift) * p.amp;
      let y = v * c.ry * breath + Math.cos(drift * 0.85) * p.amp;
      let a = p.alpha * boost;
      if (ip < 1) {
        const t = easeOut(clamp((ip - p.delay) / 0.55, 0, 1));
        x = lerp(p.sx, x, t);
        y = lerp(p.sy, y, t);
        a *= t;
      }
      if (!this.focused && Math.abs(x) < labelW && Math.abs(y) < labelH) a *= 0.15;
      if (a < 0.02) continue;
      ctx.globalAlpha = Math.min(1, a);
      atlas.draw(ctx, p.ch, cx + x, cy + y, p.size);
    }
  }

  private drawLink(atlas: GlyphAtlas, l: Link, fade: number, px: number, py: number) {
    const { ctx } = this;
    const ax = l.a.x - px * 0.5;
    const ay = l.a.y - py * 0.5;
    const bx = l.b.x - px * 0.5;
    const by = l.b.y - py * 0.5;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    // Control point pushed sideways, so links arc instead of running straight.
    const cx = (ax + bx) / 2 - dy * l.bend;
    const cy = (ay + by) / 2 + dx * l.bend;
    const angle = Math.atan2(dy, dx);
    const t0 = (edgeRadius(l.a, angle) * 1.08) / len;
    const t1 = 1 - (edgeRadius(l.b, angle + Math.PI) * 1.08) / len;
    const count = Math.floor(((t1 - t0) * len) / 13);
    if (count < 2) return;
    const glow = Math.max(l.a.hover, l.b.hover);

    for (let i = 0; i <= count; i++) {
      const t = t0 + ((t1 - t0) * i) / count;
      const shimmer = 0.75 + 0.25 * Math.sin(i * 0.9 - this.time * 2.4);
      ctx.globalAlpha = (0.16 + 0.32 * glow) * shimmer * fade * l.weight;
      atlas.draw(ctx, DOT, quad(ax, cx, bx, t), quad(ay, cy, by, t), 12);
    }
    ctx.globalAlpha = (0.45 + 0.4 * glow) * fade * Math.max(0.55, l.weight);
    for (const pk of l.packets) {
      const t = t0 + (t1 - t0) * pk.t;
      atlas.draw(ctx, pk.ch, quad(ax, cx, bx, t), quad(ay, cy, by, t), 10);
    }
  }
}
