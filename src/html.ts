const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
}

/** Attributes for a link: internal paths are routed by the app, everything else opens in a new tab. */
export function linkAttrs(href: string): string {
  if (href.startsWith('/')) return `href="${escapeHtml(href)}" data-link`;
  if (href.startsWith('mailto:')) return `href="${escapeHtml(href)}"`;
  return `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`;
}

/** Tiny inline markup: **bold** and [text](url). Pass links: false inside elements that are already links. */
export function inline(text: string, { links = true } = {}): string {
  let html = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, (_, label: string, href: string) =>
    links ? `<a ${linkAttrs(href.replace(/&amp;/g, '&'))}>${label}</a>` : label,
  );
  return html;
}
