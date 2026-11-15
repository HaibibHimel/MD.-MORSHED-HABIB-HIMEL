import type {
  ActivityLogItem,
  AdminOverviewData,
  ContactMessageItem,
  PortfolioData,
} from '@/src/types/portfolio';

const STORAGE_KEY = 'mh_portfolio_static_store_v1';

export const DEFAULT_STATIC_PORTFOLIO: PortfolioData = {
  profile: {
    full_name: 'Morshed Habib Himel',
    title_line: 'Professional Accountant | Financial Management | Microsoft Excel',
    headline: 'Turning Financial Data into Meaningful Business Insights.',
    short_intro:
      'I am a detail-oriented and analytical Accounting Professional experienced in financial records management, ledger maintenance, accounts reconciliation, bookkeeping, and financial reporting.',
    profession: 'Accountant',
    about_location: 'Palashpara, Gaibandha Sadar, Gaibandha, Bangladesh.',
    about_description:
      'An analytical accounting professional with practical experience in accounting operations, financial record management, cash handling, bank reconciliation, and Microsoft Excel. Passionate about financial accuracy, business operations, and continuous professional development.',
    profile_image_url: 'default:portrait',
    contact_email: 'morshedhimel1212@gmail.com',
    contact_phone: '+8801313723732',
    contact_location: 'Gaibandha, Bangladesh',
    languages: [{ language: 'English', level: 'Professional Working Proficiency' }],
    interests: ['Singing', 'Sports', 'Travelling'],
    cv_filename: 'Morshed_Habib_Himel_CV.pdf',
    has_custom_cv: false,
    cv_updated_at: '2026-11-14T00:00:00.000Z',
    updated_at: '2026-11-14T00:00:00.000Z',
  },
  skills: [
    {
      id: 1,
      name: 'Financial Accounting',
      category: 'Core Accounting',
      description:
        'Accurate recording of daily financial transactions, general ledger structuring, expense logging, and period-end financial summaries.',
      icon_key: 'Landmark',
      focus_label: 'Core Competency',
      sort_order: 1,
    },
    {
      id: 2,
      name: 'Accounts Reconciliation',
      category: 'Audit & Control',
      description:
        'Bank statement matching, sales register verification, DSR collection audits, and resolving ledger discrepancies systematically.',
      icon_key: 'Scale',
      focus_label: 'Verification & Control',
      sort_order: 2,
    },
    {
      id: 3,
      name: 'Microsoft Excel',
      category: 'Data & Reporting',
      description:
        'Structured financial spreadsheets, pivot summaries, formula-driven reconciliation sheets, and daily operational reporting.',
      icon_key: 'FileSpreadsheet',
      focus_label: 'Analytical Tooling',
      sort_order: 3,
    },
    {
      id: 4,
      name: 'Bookkeeping',
      category: 'Ledger Operations',
      description:
        'Systematic voucher entries, stock ledger maintenance, petty cash tracking, and organized day-to-day financial documentation.',
      icon_key: 'BookOpen',
      focus_label: 'Daily Practice',
      sort_order: 4,
    },
    {
      id: 5,
      name: 'Billing & Invoicing',
      category: 'Payables & Receivables',
      description:
        'Vendor bill verification, payment processing workflows, invoice accuracy checks, and timely settlement tracking.',
      icon_key: 'Receipt',
      focus_label: 'Operations Finance',
      sort_order: 5,
    },
    {
      id: 6,
      name: 'Problem Solving',
      category: 'Analytical Mindset',
      description:
        'Root-cause investigation of cash and stock variances, workflow coordination across service teams, and disciplined decision support.',
      icon_key: 'Compass',
      focus_label: 'Analytical Approach',
      sort_order: 6,
    },
  ],
  experiences: [
    {
      id: 1,
      role: 'Service In-Charge',
      company: 'Bazaz Uttara Motors',
      period: 'November 2026 – Present',
      location: 'Gaibandha, Bangladesh',
      responsibilities: [
        'Supervised daily service activities.',
        'Managed daily service operations.',
        'Maintained customer relationships.',
        'Ensured customer satisfaction.',
      ],
      is_current: true,
      sort_order: 1,
    },
    {
      id: 2,
      role: 'Accountant',
      company: 'Rabab Traders – A distribution house of Robi Axiata Ltd.',
      period: 'May 2026 – August 2026',
      location: 'Bangladesh',
      responsibilities: [
        'Managed daily cash collections from DSRs.',
        'Reconciled sales registers.',
        'Maintained stock ledgers.',
        'Handled daily bank deposits.',
        'Logged expenses and prepared sales summaries.',
      ],
      is_current: false,
      sort_order: 2,
    },
    {
      id: 3,
      role: 'Jr. Executive – Accounts',
      company: 'Steadfast Courier Limited',
      period: 'September 2025 – December 2025',
      location: 'Dhaka, Bangladesh',
      responsibilities: [
        'Managed daily accounting transactions.',
        'Maintained voucher entries and ledgers.',
        'Handled petty cash.',
        'Verified vendor bills.',
        'Processed payments.',
        'Assisted with bank reconciliations.',
      ],
      is_current: false,
      sort_order: 3,
    },
  ],
  education: [
    {
      id: 1,
      degree: 'BBA – Accounting',
      institution: 'Gaibandha Government College',
      university: 'National University, Bangladesh',
      period: 'June 2019 – June 2023',
      cgpa: 'CGPA: 3.18 / 4.00',
      sort_order: 1,
    },
  ],
  certifications: [
    {
      id: 1,
      title: 'AI Basic Course',
      issuer: 'Department of Youth Development (DYD), Bangladesh',
      period: 'October 2026 – November 2026',
      credential_note:
        'Foundational training in practical AI literacy, digital productivity workflows, and modern office automation.',
      sort_order: 1,
    },
    {
      id: 2,
      title: 'Computer Application & MS Excel Certification',
      issuer: 'Bangladesh Technical Education Board, Dhaka',
      period: 'January 2020 – June 2020',
      credential_note:
        'Comprehensive technical certification covering spreadsheet modeling, office applications, and structured data management.',
      sort_order: 2,
    },
  ],
  socialLinks: [
    {
      id: 1,
      platform: 'Email',
      label: 'morshedhimel1212@gmail.com',
      url: 'mailto:morshedhimel1212@gmail.com',
      sort_order: 1,
    },
    {
      id: 2,
      platform: 'Phone',
      label: '+8801313723732',
      url: 'tel:+8801313723732',
      sort_order: 2,
    },
    {
      id: 3,
      platform: 'LinkedIn',
      label: 'LinkedIn Profile',
      url: 'https://www.linkedin.com',
      sort_order: 3,
    },
  ],
};

interface StaticStore {
  portfolio: PortfolioData;
  messages: ContactMessageItem[];
  activities: ActivityLogItem[];
  visitors: Record<string, number>;
  customCvDataUrl?: string;
  adminAuthHash?: string;
  adminUsername?: string;
  adminEmail?: string;
}

const DEFAULT_CRED_HASH = '4d9e078c12e5b688f0904bfc0a700f5951104ca6ae546534460e38603e507e46';

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function readStaticStore(): StaticStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StaticStore;
      if (parsed && parsed.portfolio) return parsed;
    }
  } catch {
    // ignore storage read failure
  }
  return {
    portfolio: structuredClone(DEFAULT_STATIC_PORTFOLIO),
    messages: [],
    activities: [
      {
        id: 1,
        action: 'Static Portfolio Ready',
        details: 'Loaded verified portfolio data for static hosting.',
        actor: 'System',
        created_at: new Date().toISOString(),
      },
    ],
    visitors: {},
    adminUsername: 'himel',
    adminEmail: 'morshedhimel1212@gmail.com',
    adminAuthHash: DEFAULT_CRED_HASH,
  };
}

export function writeStaticStore(store: StaticStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota error
  }
}

export function getStaticOverview(store: StaticStore): AdminOverviewData {
  const days = Object.entries(store.visitors)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, visits]) => ({ day, visits }));
  const totalVisitors = Object.values(store.visitors).reduce((acc, n) => acc + n, 0);
  const today = new Date().toISOString().slice(0, 10);

  return {
    stats: {
      totalVisitors,
      todayVisitors: store.visitors[today] || 0,
      totalMessages: store.messages.length,
      unreadMessages: store.messages.filter((m) => m.status === 'unread').length,
      skillsCount: store.portfolio.skills.length,
      expCount: store.portfolio.experiences.length,
      certCount: store.portfolio.certifications.length,
      eduCount: store.portfolio.education.length,
    },
    visitorTrend: days,
    recentActivities: store.activities.slice(0, 12),
  };
}
