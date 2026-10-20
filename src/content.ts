// ---------------------------------------------------------------------------
// Everything you will want to edit lives in this file.
//
// Inline text supports **bold** and [links](https://example.com).
// Links that start with "/" (for example [contact](/contact)) stay inside the site.
// ---------------------------------------------------------------------------

export type SectionId = 'about' | 'experience' | 'projects' | 'contact';

export const site = {
  name: 'Your Name',
  role: 'Software Engineer',
  /** Browser tab title of a section reads "About — Your Name". */
  titleSeparator: ' — ',
};

export interface WorldNode {
  id: SectionId;
  label: string;
  /**
   * Where the glyph cloud sits on desktop screens.
   * [0, 0] is the top-left spot a cloud can take without leaving the screen, [1, 1] the bottom-right.
   * On phones the clouds are stacked in a zig-zag automatically.
   */
  position: [number, number];
}

/** The clouds on the home screen. Remove one here and its page disappears too. */
export const nodes: WorldNode[] = [
  { id: 'about', label: 'About', position: [0.06, 0.08] },
  { id: 'experience', label: 'Experience', position: [0.46, 0.55] },
  { id: 'projects', label: 'Projects', position: [0.94, 0.14] },
  { id: 'contact', label: 'Contact', position: [0.8, 0.98] },
];

// --- About -----------------------------------------------------------------

export const about = {
  paragraphs: [
    'One or two sentences on **what you do** and where you are based.',
    'What you are working on now, and the kind of problems you like to solve.',
    'Where you worked before, and the one thing you are proudest of there.',
    'Something outside work that says how you think. Want to talk? [Get in touch](/contact).',
  ],
  /**
   * Turned into ASCII art in the browser. A photo with the background removed looks best
   * (a transparent PNG). Put the file in public/ and point to it here, e.g. '/portrait.png'.
   */
  portrait: { src: '/portrait.svg', cols: 96 },
};

// --- Experience ------------------------------------------------------------

export interface Role {
  title: string;
  period: string;
  /** Marks the role with an animated underline. */
  current?: boolean;
  highlights: string[];
}

export interface Entry {
  name: string;
  url?: string;
  /** Optional logo in public/ (SVG or transparent PNG). Without one, the initials are drawn in ASCII. */
  logo?: string;
  initials: string;
  roles: Role[];
}

/** Put your PDF at public/cv.pdf, or set this to null to hide the row. */
export const cv: { href: string; note: string } | null = {
  href: '/cv.pdf',
  note: 'The complete, up-to-date version of my resume.',
};

export const experience: { title: string; entries: Entry[] }[] = [
  {
    title: 'Work',
    entries: [
      {
        name: 'Company One',
        url: 'https://example.com',
        initials: 'C1',
        roles: [
          {
            title: 'Senior Software Engineer',
            period: 'Jan 2025 – Present',
            current: true,
            highlights: [
              'Owned **the system you are responsible for** and what it does for the business.',
              'Built **a specific thing** with a specific technique, and the measurable result.',
              'Led **a migration or rollout**: how many services, teams or customers it touched.',
            ],
          },
          {
            title: 'Software Engineer',
            period: 'Mar 2023 – Dec 2024',
            highlights: [
              'Shipped **a feature or service**, and who uses it.',
              'Improved **a metric** from one number to another.',
            ],
          },
        ],
      },
      {
        name: 'Company Two',
        url: 'https://example.com',
        initials: 'C2',
        roles: [
          {
            title: 'Software Engineer',
            period: 'Jul 2020 – Feb 2023',
            highlights: [
              'Designed **a piece of infrastructure**, and what it made possible.',
              'Mentored **a number of engineers** or ran a process the team still uses.',
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Education',
    entries: [
      {
        name: 'University Name',
        initials: 'U',
        roles: [{ title: 'B.Sc. in Computer Science', period: '2016 – 2020', highlights: [] }],
      },
    ],
  },
];

// --- Projects --------------------------------------------------------------

export const projects: { name: string; meta: string; description: string; url: string }[] = [
  {
    name: 'project-one',
    meta: 'Go',
    description: 'One sentence on what it does and why it is interesting.',
    url: 'https://github.com/',
  },
  {
    name: 'project-two',
    meta: 'Rust',
    description: 'One sentence on what it does and why it is interesting.',
    url: 'https://github.com/',
  },
  {
    name: 'project-three',
    meta: 'Python · Kafka',
    description: 'One sentence on what it does and why it is interesting.',
    url: 'https://github.com/',
  },
];

// --- Contact ---------------------------------------------------------------

export const contact = {
  intro: 'The fastest way to reach me is email. I usually reply within a couple of days.',
  /** Also shown in the menu behind the arrow in the bottom-right corner. */
  links: [
    { label: 'Email', value: 'you@example.com', href: 'mailto:you@example.com' },
    { label: 'GitHub', value: 'github.com/you', href: 'https://github.com/' },
    { label: 'LinkedIn', value: 'linkedin.com/in/you', href: 'https://www.linkedin.com/' },
  ],
};

// --- Booking (on the contact page) ------------------------------------------

export interface BookingEvent {
  label: string;
  duration: string;
  /**
   * Your Cal.com link without the domain, e.g. 'your-username/coffee-chat'.
   * Leave it empty and the event is skipped.
   */
  calLink: string;
}

/**
 * A Cal.com calendar where visitors pick a time themselves.
 * Until at least one calLink is filled in, the section is hidden on the live site
 * and shows setup notes during `npm run dev`.
 */
export const booking = {
  title: 'Book a call',
  note: 'Pick a time that works for you. You will get a calendar invite with a video link.',
  events: [
    { label: 'Coffee chat or meeting', duration: '30 min', calLink: 'albert-lo-lkzaub/contact' },
    // Add another Cal.com event type and the card shows tabs to switch between them, e.g.
    // { label: 'Meeting', duration: '45 min', calLink: 'albert-lo-lkzaub/meeting' },
  ] satisfies BookingEvent[],
  /** Change only if you self-host Cal.com. */
  origin: 'https://app.cal.com',
};
