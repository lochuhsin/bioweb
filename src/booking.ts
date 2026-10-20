// The "Book a call" calendar on the contact page.
//
// The calendar itself is Cal.com's booking page, embedded with Cal.com's hosted embed script.
// The script is loaded from Cal.com only when the contact page opens; none of its code is bundled here.
// This file adds the tabs between event types, the loading state, and keeps the calendar's
// colors in step with the site theme.

import { booking, type BookingEvent } from './content';
import type { Theme } from './theme';

type CalCall = (...args: unknown[]) => void;
interface CalQueue extends CalCall {
  /** Calls made before embed.js has loaded; embed.js replays them. */
  q: unknown[][];
}
interface CalGlobal extends CalQueue {
  ns: Record<string, CalQueue>;
  loaded?: boolean;
}

declare global {
  interface Window {
    Cal?: CalGlobal;
  }
}

export const bookingEvents = (): BookingEvent[] => booking.events.filter((e) => e.calLink.trim() !== '');

function createQueue(): CalQueue {
  const queue = ((...args: unknown[]) => {
    queue.q.push(args);
  }) as CalQueue;
  queue.q = [];
  return queue;
}

/** Sets up window.Cal so calls can be made right away, and starts loading embed.js once. */
function ensureCal(): void {
  if (window.Cal) return;
  const cal = createQueue() as CalGlobal;
  cal.ns = {};
  cal.loaded = true;
  window.Cal = cal;
  const script = document.createElement('script');
  script.src = `${booking.origin}/embed/embed.js`;
  script.async = true;
  document.head.append(script);
}

/** One namespace per event type, so each tab keeps its own calendar. */
function ensureNamespace(name: string): void {
  ensureCal();
  const cal = window.Cal!;
  if (cal.ns[name]) return;
  const ns = createQueue();
  ns('init', name, { origin: booking.origin });
  cal.ns[name] = ns;
  cal('initNamespace', name);
}

// embed.js may swap window.Cal and its namespaces for live versions after loading,
// so always look them up at call time instead of keeping references.
const call = (namespace: string, ...args: unknown[]) => window.Cal?.ns[namespace]?.(...args);

function uiConfig(theme: Theme) {
  return {
    theme,
    layout: 'month_view',
    hideEventTypeDetails: false,
    cssVarsPerTheme: {
      dark: {
        'cal-brand': '#f2f2f2',
        'cal-bg': '#000000',
        'cal-border': 'rgba(255, 255, 255, 0.14)',
        'cal-border-subtle': 'rgba(255, 255, 255, 0.1)',
      },
      light: {
        'cal-brand': '#0d0d0d',
        'cal-bg': '#f7f7f5',
        'cal-border': 'rgba(0, 0, 0, 0.14)',
        'cal-border-subtle': 'rgba(0, 0, 0, 0.1)',
      },
    },
  };
}

/** Event listeners from the previous load, removed before adding new ones. */
const listeners = new Map<string, { action: string; callback: () => void }[]>();

function listen(namespace: string, panel: HTMLElement) {
  for (const old of listeners.get(namespace) ?? []) call(namespace, 'off', old);
  const fresh = [
    { action: 'linkReady', callback: () => panel.classList.add('is-ready') },
    { action: 'linkFailed', callback: () => panel.classList.add('is-failed') },
  ];
  for (const l of fresh) call(namespace, 'on', l);
  listeners.set(namespace, fresh);
}

interface BookingState {
  panels: HTMLElement[];
  loaded: Set<number>;
  selected: number;
  theme: Theme;
}

/** The booking card currently on the page, if any. */
let state: BookingState | null = null;

/** Puts the calendar for one event type into its panel (once per theme). */
function load(index: number) {
  if (!state || state.loaded.has(index)) return;
  state.loaded.add(index);
  const panel = state.panels[index];
  const namespace = `booking-${index}`;
  ensureNamespace(namespace);
  panel.classList.remove('is-ready', 'is-failed');
  listen(namespace, panel);
  call(namespace, 'inline', {
    elementOrSelector: panel.querySelector('.booking-frame'),
    calLink: bookingEvents()[index].calLink,
    config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
  });
  call(namespace, 'ui', uiConfig(state.theme));
}

/** Wires up the booking card rendered by sections.ts. Call it each time the contact page opens. */
export function mountBooking(root: ParentNode, theme: Theme) {
  state = null;
  const card = root.querySelector<HTMLElement>('.booking');
  if (!card) return;
  const tabs = [...card.querySelectorAll<HTMLButtonElement>('[data-booking-tab]')];
  const panels = [...card.querySelectorAll<HTMLElement>('[data-booking-panel]')];
  // The setup notes have no calendars; don't load anything from Cal.com for them.
  if (panels.length === 0) return;
  const current: BookingState = { panels, loaded: new Set(), selected: 0, theme };
  state = current;

  const select = (index: number, focus = false) => {
    current.selected = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    load(index);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      select((i + step + tabs.length) % tabs.length, true);
    });
  });
  select(0);
}

/**
 * Cal.com does not fully recolor a calendar that is already loaded, so after a theme switch
 * the calendars are loaded again in the new theme. The theme wipe hides the swap.
 */
export function setBookingTheme(theme: Theme) {
  if (!state || !state.panels[0].isConnected) return;
  state.theme = theme;
  state.loaded.clear();
  for (const panel of state.panels) {
    panel.querySelector('.booking-frame')?.replaceChildren();
    panel.classList.remove('is-ready', 'is-failed');
  }
  load(state.selected);
}
