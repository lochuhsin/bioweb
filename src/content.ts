// ---------------------------------------------------------------------------
// Everything you will want to edit lives in this file.
//
// Inline text supports **bold** and [links](https://example.com).
// Links that start with "/" (for example [contact](/contact)) stay inside the site.
// ---------------------------------------------------------------------------

export type SectionId = 'about' | 'experience' | 'projects' | 'contact';

export const site = {
  name: 'Chu-Hsin (Albert) Lo',
  // A positioning line, not a job title. resume.yaml keeps "Senior" out of public places
  // that can be checked against an employer's title; change it here if you decide otherwise.
  role: 'Backend Engineer',
  /** Browser tab title of a section reads "About — Chu-Hsin (Albert) Lo". */
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
  /** One line on what the company does, shown under its name. */
  about?: string;
  /** Optional logo in public/ (SVG or transparent PNG). Without one, the initials are drawn in ASCII. */
  logo?: string;
  initials: string;
  roles: Role[];
}

/**
 * Put your PDF at public/cv.pdf and set this to { href: '/cv.pdf', note: '...' } to show the row.
 * Hidden for now: the built resumes still have open placeholders and a phone-number slot.
 */
export const cv: { href: string; note: string } | null = null;

// Every highlight below comes from ~/Desktop/Career/resume-system/resume.yaml (bullet ID in the comment),
// which in turn traces to history/ and profile/. Change the facts there first, then here.
export const experience: { title: string; entries: Entry[] }[] = [
  {
    title: 'Work',
    entries: [
      {
        name: 'Fasttrack Solutions',
        url: 'https://www.fasttrack.ai/en',
        about: 'Real-time CRM and player-engagement platform for iGaming operators; event-driven on RabbitMQ and Kafka. Sliema, Malta.',
        initials: 'FT',
        roles: [
          {
            title: 'Software Engineer, System Performance Team',
            period: 'Jan 2025 – Present',
            current: true,
            highlights: [
              // FT scope
              'Appointed **Performance and Reliability Champion** for one of the company’s four products, owning performance reviews and performance and reliability incidents across its **10 services**; previously handled performance for another product’s 30 microservices.',
              // FT-KAFKA
              'Helped design and build a **Kafka/RabbitMQ message SDK**, switchable per client namespace, after client traffic of **100M messages an hour** overwhelmed RabbitMQ; one client runs ~9.3K msg/s and drains 2.5M lag spikes in 5 minutes.',
              // FT-BENCH
              'Set up **per-merge performance benchmarks** in GitHub CI for each of the product’s services (CPU, memory, Kafka consumer msg/s), now adopted by another product; they caught a feature causing **~5x lag** (10x on some messages).',
              // FT-INCIDENT
              '**SRE’s direct escalation point** across the product’s 10 services for P0–P2 slow-processing incidents, service crashes and frequent pod restarts.',
              // FT-LOGIN-P0
              '**Diagnosed and rolled back a P0** after a release: login audit logs backed up through RabbitMQ and OOM-killed backend pods, locking out users of 30–40 clients; the long-term decision gives login priority over audit logging.',
              // FT-IDEMPOTENT
              'Handled duplicate deliveries (repeated logins, double-clicked email links, duplicate client messages and reward events) with a lazily loaded **three-tier dedup check** on hashed message fields: memory, Redis, database.',
              // FT-BATCH
              '**Introduced batch consuming** in multiple core services, now used by all of the product’s consumers instead of one-by-one processing, reducing load on ClickHouse and Redis-backed data paths.',
            ],
          },
        ],
      },
      {
        name: 'Linker Vision',
        url: 'https://www.linkervision.com/',
        about: 'Vision AI platform for smart cities; worked on DataVerse, its SaaS for AI data management and model training. Taipei, Taiwan.',
        initials: 'LV',
        roles: [
          {
            title: 'Team Lead, Backend Engineer',
            period: 'Jun 2024 – Jan 2025',
            highlights: [
              // LV-LEAD (promotion: history 07)
              '**Promoted to lead a team of 7** (4 backend, 2 frontend, 1 QA; 6 direct reports): ran sprint planning and retros, biweekly 1:1s and two-way performance reviews; interviewed candidates and onboarded one new hire, with no attrition.',
              // LV-MULTITENANT
              '**Led the move of 60+ tenants (later 100+) to multi-tenant SaaS** as clients and data load grew: a central service authenticates users and passes tenant_id to backends, with a database per tenant for security and isolation.',
              // LV-INFRA
              'Spearheaded the infrastructure strategy as usage grew: **moved the SaaS from Azure AKS to AWS EKS**, designing and provisioning EKS with Terraform for 100+ enterprise tenants, while still deploying to clients’ Azure.',
            ],
          },
          {
            title: 'Backend Software Engineer',
            period: 'Jul 2022 – Jun 2024',
            highlights: [
              // LV-DATAPLAT (summary S-DATA wording; the [placeholders] are left out)
              'Built a **high-throughput data platform** capable of processing 100K+ simultaneous data-entry requests, with fast search and filtering across million-record, multi-source data.',
              // LV-DB
              'Scaled the database tier to **10K+ QPS** with connection pooling and read/write splitting, eliminating connection bottlenecks.',
              // LV-OBS
              'Established observability with **Grafana and Loki** (system resources, logs, server health), shortening incident resolution.',
            ],
          },
        ],
      },
      {
        name: 'Glaibo Digital Co.',
        about: 'Taipei, Taiwan.',
        initials: 'GL',
        roles: [
          {
            title: 'Software Engineer',
            period: 'Jul 2021 – Jun 2022',
            highlights: [
              // GL-BACKEND
              'Deployed highly available production backends with **FastAPI and Gin**, provisioning AWS infrastructure with Kubernetes and Terraform.',
              // GL-ETL
              'Architected automated **Airflow ETL pipelines (20+ DAGs)** that ingest, process and transform millions of records for downstream ML models.',
              // GL-RECSYS
              'Designed and deployed a **hybrid recommender** (personalized and non-personalized) for a 1,000+ product catalog.',
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
        name: 'National Taiwan University',
        url: 'https://www.ntu.edu.tw/',
        initials: 'NTU',
        roles: [
          {
            title: 'Graduate Studies in Physics, High Energy Physics Group',
            period: 'Until Jun 2020',
            // ED-NTU
            highlights: ['Thesis research on measuring the decay of a neutral B meson into two neutral pions (B0 → π0π0).'],
          },
        ],
      },
      {
        name: 'National Changhua University',
        initials: 'NC',
        roles: [{ title: 'B.Sc. in Physics', period: 'Until Jun 2017', highlights: [] }],
      },
    ],
  },
];

// --- Projects --------------------------------------------------------------

export const projects: { name: string; meta: string; description: string; url: string }[] = [
  {
    name: 'lolang',
    meta: 'Rust',
    description: 'A small Lox-flavored programming language built from scratch: a single-pass bytecode compiler feeding a stack-based virtual machine, with a REPL.',
    url: 'https://github.com/lochuhsin/lolang',
  },
  {
    name: 'rebitcask',
    meta: 'Go',
    description: 'A Bitcask-inspired key-value store with an LSM-tree engine (memtables, asynchronous SSTable flushing, per-segment indexes), served over HTTP and gRPC. A Raft cluster layer is in progress.',
    url: 'https://github.com/lochuhsin/bitcask',
  },
  {
    name: 'gopher-forge',
    meta: 'Go',
    description: 'Synchronization primitives rebuilt from first principles: spin, ticket and MCS locks, semaphores, lock-free variants and memory reclamation, each with concurrent tests and benchmarks.',
    url: 'https://github.com/lochuhsin/gopher-forge',
  },
];

// --- Contact ---------------------------------------------------------------

export const contact = {
  intro: 'The fastest way to reach me is email. I usually reply within a couple of days.',
  /** Also shown in the menu behind the arrow in the bottom-right corner. */
  links: [
    { label: 'Email', value: 'lochuhsin@gmail.com', href: 'mailto:lochuhsin@gmail.com' },
    { label: 'GitHub', value: 'github.com/lochuhsin', href: 'https://github.com/lochuhsin' },
    { label: 'LinkedIn', value: 'linkedin.com/in/lochuhsin', href: 'https://www.linkedin.com/in/lochuhsin/' },
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
