// ---------------------------------------------------------------------------
// Everything you will want to edit lives in this file.
//
// Inline text supports **bold** and [links](https://example.com).
// Links that start with "/" (for example [contact](/contact)) stay inside the site.
// ---------------------------------------------------------------------------

export type SectionId = 'about' | 'experience' | 'contact';

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
  { id: 'about', label: 'About', position: [0.08, 0.1] },
  { id: 'experience', label: 'Experience', position: [0.92, 0.32] },
  { id: 'contact', label: 'Contact', position: [0.36, 0.95] },
];

// --- About -----------------------------------------------------------------

export const about = {
  // How you think as an engineer, in your own voice. Keep it short enough to fit on one screen.
  paragraphs: [
    'I’m a software engineer who is happiest when a system is under pressure. My field is **performance and reliability for high-throughput, event-driven systems**, where every queue, batch and lock matters, and sometimes every microsecond.',
    'I’m drawn to problems that look impossible at first. When a system supposedly can’t take more load, that’s where I want to start: push it until I know exactly where and why it breaks, then engineer it past that point.',
    'I measure before I guess, and I’m not done until I understand why something is fast, not just that it is. When in doubt, I go back to first principles and build it myself.',
    'Have a system that needs to handle more than anyone thinks it can? [Let’s talk](/contact).',
  ],
  /**
   * Shows the ASCII portrait from src/portrait-ascii.ts. Only that text is published, never the photo.
   * To change it: put a background-removed PNG in private/ (git ignores that folder), then run
   * `npm run portrait -- private/your-photo.png 110` (the number is the width in characters).
   */
  portrait: true,
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

export interface Project {
  name: string;
  meta: string;
  description: string;
  url: string;
}

/** A group on the experience page: jobs and schools (entries), or a list of projects. */
export type ExperienceGroup = { title: string; entries: Entry[] } | { title: string; projects: Project[] };

/**
 * Put your PDF at public/cv.pdf and set this to { href: '/cv.pdf', note: '...' } to show the row.
 * Hidden for now: the built resumes still have open placeholders and a phone-number slot.
 */
export const cv: { href: string; note: string } | null = null;

// Every highlight below comes from ~/Desktop/Career/resume-system/resume.yaml (bullet ID in the comment),
// which in turn traces to history/ and profile/. Change the facts there first, then here.
// Groups are shown in this order.
export const experience: ExperienceGroup[] = [
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
    title: 'Side projects',
    // PR-MATCH, PR-KV and PR-CONCURRENCY in resume.yaml; lolang from its README.
    // hypermatch's README latency numbers are targets, not measurements: don't print them until measured.
    projects: [
      {
        name: 'hypermatch',
        meta: 'Rust · in progress',
        description: 'An exchange’s order-entry hot path, from the wire to the fill: a single-writer matching core in the LMAX Disruptor style, lock-free ring buffers between threads, io_uring ingress and an append-only journal for deterministic replay.',
        url: 'https://github.com/lochuhsin/hypermatch',
      },
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
