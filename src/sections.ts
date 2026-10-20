// HTML for each section page. The words come from content.ts; this file only decides the layout.

import { about, contact, cv, experience, projects, type Entry, type Role, type SectionId } from './content';
import { escapeHtml, inline, linkAttrs } from './html';
import { icon } from './icons';

interface AsciiFigure {
  src?: string;
  text?: string;
  cols: number;
  mode: 'luma' | 'alpha';
  className: string;
  label?: string;
}

function asciiFigure(f: AsciiFigure): string {
  const source = f.src ? `data-src="${escapeHtml(f.src)}"` : `data-text="${escapeHtml(f.text ?? '')}"`;
  const a11y = f.label ? `role="img" aria-label="${escapeHtml(f.label)}"` : 'aria-hidden="true"';
  return `<figure class="ascii ${f.className}" ${source} data-cols="${f.cols}" data-mode="${f.mode}" style="--cols:${f.cols}" ${a11y}><pre class="ascii-art"></pre></figure>`;
}

function aboutPage(): string {
  return `
    <div class="about-grid">
      <div class="about-text">${about.paragraphs.map((p) => `<p>${inline(p)}</p>`).join('')}</div>
      <div class="about-portrait">${asciiFigure({ ...about.portrait, mode: 'luma', className: 'portrait', label: 'Portrait drawn in ASCII characters' })}</div>
    </div>`;
}

function cvRow(): string {
  if (!cv) return '';
  return `
    <div class="cv-row">
      <div>
        <p class="kicker">Curriculum vitae · PDF</p>
        <p class="note">${inline(cv.note)}</p>
      </div>
      <div class="cv-actions">
        <a class="square-button" href="${escapeHtml(cv.href)}" target="_blank" rel="noopener" aria-label="Open the CV in a new tab">${icon('eye')}</a>
        <a class="square-button" href="${escapeHtml(cv.href)}" download aria-label="Download the CV">${icon('download')}</a>
      </div>
    </div>`;
}

function role(r: Role): string {
  const highlights = r.highlights.length ? `<ul class="highlights">${r.highlights.map((h) => `<li>${inline(h)}</li>`).join('')}</ul>` : '';
  return `
    <section class="role${r.current ? ' is-current' : ''}">
      <div class="role-head">
        <h4 class="role-title">${escapeHtml(r.title)}</h4>
        <span class="role-period">${escapeHtml(r.period)}</span>
      </div>
      ${highlights}
    </section>`;
}

function entry(e: Entry): string {
  const logo = asciiFigure(e.logo ? { src: e.logo, cols: 30, mode: 'alpha', className: 'logo' } : { text: e.initials, cols: 30, mode: 'alpha', className: 'logo' });
  const logoBox = e.url ? `<a class="entry-logo" ${linkAttrs(e.url)} tabindex="-1" aria-hidden="true">${logo}</a>` : `<div class="entry-logo">${logo}</div>`;
  const name = e.url ? `<a ${linkAttrs(e.url)}>${escapeHtml(e.name)}</a>` : escapeHtml(e.name);
  return `
    <article class="entry">
      ${logoBox}
      <div class="entry-main">
        <h3 class="entry-name">${name}</h3>
        ${e.roles.map(role).join('')}
      </div>
    </article>`;
}

function experiencePage(): string {
  const groups = experience
    .map((g) => `<section class="group"><h2 class="group-title">${escapeHtml(g.title)}</h2>${g.entries.map(entry).join('')}</section>`)
    .join('');
  return cvRow() + groups;
}

function projectsPage(): string {
  const rows = projects
    .map(
      (p) => `
      <li>
        <a class="row" ${linkAttrs(p.url)}>
          <div class="row-copy">
            <div class="row-head"><h3 class="row-name">${escapeHtml(p.name)}</h3><span class="row-meta">${escapeHtml(p.meta)}</span></div>
            <p class="row-text">${inline(p.description, { links: false })}</p>
          </div>
          ${icon('arrow', 'icon row-arrow')}
        </a>
      </li>`,
    )
    .join('');
  return `<ul class="row-list">${rows}</ul>`;
}

function contactPage(): string {
  const rows = contact.links
    .map(
      (l) => `
      <li>
        <a class="row" ${linkAttrs(l.href)}>
          <div class="row-copy">
            <p class="kicker row-kicker">${escapeHtml(l.label)}</p>
            <p class="row-name">${escapeHtml(l.value)}</p>
          </div>
          ${icon('arrow', 'icon row-arrow')}
        </a>
      </li>`,
    )
    .join('');
  return `<p class="lead">${inline(contact.intro)}</p><ul class="row-list">${rows}</ul>`;
}

const pages: Record<SectionId, () => string> = {
  about: aboutPage,
  experience: experiencePage,
  projects: projectsPage,
  contact: contactPage,
};

export function renderSection(id: SectionId, title: string): string {
  return `
    <article class="section section--${id}">
      <a class="back" href="/" data-link>${icon('back')}<span>Back</span></a>
      <header class="section-header"><h1 class="section-title" tabindex="-1">${escapeHtml(title)}</h1></header>
      <div class="section-body">${pages[id]()}</div>
    </article>`;
}
