import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/work-sans';
import '@fontsource-variable/instrument-sans';
import './styles.css';

import { hydrateAscii } from './ascii';
import { runBoot } from './boot';
import { mountBooking, setBookingTheme } from './booking';
import { contact, nodes, site, type SectionId } from './content';
import { escapeHtml, linkAttrs } from './html';
import { icon } from './icons';
import { startLogo } from './logo';
import { scrambleText, setScrambleReducedMotion } from './scramble';
import { renderSection } from './sections';
import { currentTheme, switchTheme, themeVar } from './theme';
import { World } from './world';

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const panel = byId('panel');
const nameEl = byId('chrome-name');
const roleEl = byId('chrome-role');
const themeButton = byId<HTMLButtonElement>('theme-toggle');
const motionButton = byId<HTMLButtonElement>('motion-toggle');
const footerMenu = byId('footer-menu');
const footerToggle = byId<HTMLButtonElement>('footer-toggle');

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reducedQuery.matches;
let paused = false;

const fontsReady = Promise.all([
  document.fonts.load('500 16px "JetBrains Mono Variable"'),
  document.fonts.load('700 16px "JetBrains Mono Variable"'),
  document.fonts.load('600 20px "Work Sans Variable"'),
  document.fonts.load('400 16px "Instrument Sans Variable"'),
]).catch(() => undefined);

const world = new World({
  canvas: byId<HTMLCanvasElement>('world-canvas'),
  layer: byId('nodes'),
  nodes,
  color: themeVar('--fg'),
});
world.setReducedMotion(reduced);
const logo = startLogo(byId<HTMLCanvasElement>('logo'), themeVar('--fg'));
logo.setPaused(reduced);

// --- chrome ----------------------------------------------------------------

nameEl.textContent = site.name;
roleEl.textContent = site.role;
document.title = site.name;
byId('version').textContent = __BUILD_SHA__;

byId('footer-links').innerHTML = contact.links.map((l) => `<li><a ${linkAttrs(l.href)}>${escapeHtml(l.label)}</a></li>`).join('');
footerToggle.innerHTML = icon('back');
footerToggle.addEventListener('click', () => {
  const open = !footerMenu.classList.contains('is-open');
  footerMenu.classList.toggle('is-open', open);
  footerToggle.setAttribute('aria-expanded', String(open));
  footerToggle.setAttribute('aria-label', open ? 'Hide links' : 'Show links');
});

function renderThemeLabel(animate: boolean) {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  themeButton.setAttribute('aria-label', `Switch to ${next} theme`);
  const text = `[${next}]`;
  if (animate) scrambleText(themeButton, text);
  else themeButton.textContent = text;
}

let switching = false;
themeButton.addEventListener('click', async () => {
  if (switching) return;
  switching = true;
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  await switchTheme(next, byId<HTMLCanvasElement>('theme-wipe'), !reduced, () => {
    const fg = themeVar('--fg');
    world.setColor(fg);
    logo.setColor(fg);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeVar('--bg'));
    panel.querySelectorAll<HTMLElement>('figure.ascii').forEach((fig) => hydrateAscii(fig, { invert: next === 'light', animate: false }));
    setBookingTheme(next);
    renderThemeLabel(true);
  });
  switching = false;
});

function applyMotion() {
  const still = reduced || paused;
  world.setPaused(paused);
  world.setReducedMotion(reduced);
  logo.setPaused(still);
  setScrambleReducedMotion(reduced);
  document.documentElement.classList.toggle('is-still', still);
  motionButton.textContent = paused ? 'Resume ambient motion' : 'Pause ambient motion';
  motionButton.setAttribute('aria-pressed', String(paused));
}
motionButton.addEventListener('click', () => {
  paused = !paused;
  applyMotion();
});
reducedQuery.addEventListener('change', (e) => {
  reduced = e.matches;
  applyMotion();
});

// --- routing ---------------------------------------------------------------

const routes = new Map<string, SectionId>(nodes.map((n) => [`/${n.id}`, n.id]));
let openId: SectionId | null = null;
let panelTimer = 0;

function sectionFromPath(): SectionId | null {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  return routes.get(path) ?? null;
}

function navigate(path: string) {
  if (path !== location.pathname) history.pushState(null, '', path);
  applyRoute(false);
}

function showPanel(id: SectionId, title: string, animate: boolean) {
  panel.innerHTML = renderSection(id, title);
  panel.hidden = false;
  panel.scrollTop = 0;
  world.setDimmed(true);
  requestAnimationFrame(() => panel.classList.add('is-visible'));
  const heading = panel.querySelector<HTMLElement>('.section-title');
  if (heading) {
    heading.focus({ preventScroll: true });
    if (animate) scrambleText(heading, title, { delay: 150, stagger: 45 });
  }
  const invert = currentTheme() === 'light';
  panel.querySelectorAll<HTMLElement>('figure.ascii').forEach((fig) => hydrateAscii(fig, { invert, animate: animate && !reduced }));
  if (id === 'contact') mountBooking(panel, currentTheme());
}

function hidePanel() {
  panel.classList.remove('is-visible');
  window.setTimeout(() => {
    if (panel.classList.contains('is-visible')) return;
    panel.hidden = true;
    panel.innerHTML = '';
  }, 450);
}

function applyRoute(initial: boolean) {
  const id = sectionFromPath();
  if (!id && location.pathname !== '/') history.replaceState(null, '', '/');
  if (id === openId) return;
  window.clearTimeout(panelTimer);
  const instant = initial || reduced;

  if (id) {
    const node = nodes.find((n) => n.id === id)!;
    const switchingSection = openId !== null;
    openId = id;
    document.title = `${node.label}${site.titleSeparator}${site.name}`;
    document.body.classList.add('has-section');
    if (switchingSection) hidePanel();
    const duration = world.focus(id, instant);
    // Let the camera travel most of the way in before the page fades up over it.
    const wait = instant ? 0 : Math.max(duration * 0.6, switchingSection ? 450 : 0);
    panelTimer = window.setTimeout(() => showPanel(id, node.label, !instant || !initial), wait);
  } else {
    openId = null;
    document.title = site.name;
    document.body.classList.remove('has-section');
    hidePanel();
    world.setDimmed(false);
    world.unfocus(instant);
  }
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[data-link]');
  if (!link) return;
  e.preventDefault();
  navigate(new URL(link.href).pathname);
});
window.addEventListener('popstate', () => applyRoute(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openId) navigate('/');
});
history.scrollRestoration = 'manual';

// --- start -----------------------------------------------------------------

async function start() {
  applyMotion();
  renderThemeLabel(false);

  let firstVisit = true;
  try {
    firstVisit = !sessionStorage.getItem('booted');
    sessionStorage.setItem('booted', '1');
  } catch {
    // Storage blocked: show the boot screen every time.
  }

  if (firstVisit && !reduced) {
    await runBoot(byId('boot'), byId('boot-art'), byId('boot-dots'), fontsReady);
  } else {
    await Promise.race([fontsReady, new Promise((r) => setTimeout(r, 800))]);
  }

  world.refreshGlyphs();
  const deepLink = sectionFromPath() !== null;
  applyRoute(true);
  world.startIntro(deepLink);
  if (!deepLink && !reduced) {
    scrambleText(nameEl, site.name, { delay: 250 });
    scrambleText(roleEl, site.role, { delay: 450, stagger: 18 });
  }
}

start();
