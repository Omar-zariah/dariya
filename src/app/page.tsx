import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  ShieldCheck,
  ClipboardCheck,
  Wrench,
  Wallet,
  Globe2,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  CheckCircle2,
  Users,
  BarChart3,
  FileText,
  Bell,
  Lock,
  Camera,
  Check,
  FileSpreadsheet,
  FolderCheck,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { language } from '@/lib/i18n-server';
import { configured, supabaseServer } from '@/lib/supabase/server';
import { LanguagePicker } from '@/components/language';

// ── Static data ─────────────────────────────────────────────────────────────

const services = [
  {
    Icon: ShieldCheck,
    title: 'Property Oversight',
    detail: 'Monitor your property condition, occupancy and key events remotely with documented audit trails.',
  },
  {
    Icon: Wrench,
    title: 'Maintenance Coordination',
    detail: 'Submit requests, receive verified quotes in MAD, approve work, and track artisan completion.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Physical Field Inspections',
    detail: 'Scheduled visits by licensed local agents with 10-point checklists and high-resolution photo evidence.',
  },
  {
    Icon: Wallet,
    title: 'Financial Ledger & Cash Flow',
    detail: 'Track confirmed tenant rent payments, utility bills, and maintenance expenses in one clean ledger.',
  },
  {
    Icon: Building2,
    title: 'Portfolio Management',
    detail: 'Manage multiple apartments, villas, and houses in Tangier from a single unified owner dashboard.',
  },
  {
    Icon: Globe2,
    title: 'Remote-First for MRE',
    detail: 'Designed specifically for Moroccans in France, Belgium, Spain, UAE and worldwide. Accessible anywhere.',
  },
];

const whyItems = [
  {
    Icon: Lock,
    title: 'Zero Public Data Exposure',
    body: 'Private document storage with signed expiring links. Your property records and title deeds are strictly isolated.',
  },
  {
    Icon: CheckCircle2,
    title: 'Honest, Real Event Records',
    body: 'Every dirham, inspection report and maintenance ticket reflects real ground actions — never simulated or invented.',
  },
  {
    Icon: Users,
    title: 'Licensed Local Tangier Team',
    body: 'Our trusted on-the-ground Moroccan operations team screens technicians and conducts on-site checks.',
  },
  {
    Icon: BarChart3,
    title: 'Complete Financial Clarity',
    body: 'Track rents, management fees, Amendis utility invoices, and repair costs in Moroccan dirhams (MAD).',
  },
  {
    Icon: Bell,
    title: 'Instant Action Notifications',
    body: 'Get notified via email and dashboard when an inspection is completed, a quote is submitted, or rent arrives.',
  },
  {
    Icon: FileText,
    title: 'Permanent Document Vault',
    body: 'Archive title deeds (Moulkiya), legalized lease agreements, and invoices with secure expiring download links.',
  },
];

const faqs = [
  {
    q: 'What is DARIYA and who is it designed for?',
    a: 'DARIYA is a dedicated property management platform for Moroccans Living Abroad (MRE — Marocains Résidant à l’Étranger). Whether you have a vacation apartment in Tangier Marina Bay, a family villa in Malabata, or rental units, DARIYA connects you with licensed local operations so you can inspect, maintain, and track your property from anywhere.',
  },
  {
    q: 'How does maintenance quote approval work?',
    a: 'When an issue is reported, our local team inspects the problem and requests a detailed quotation from a vetted Moroccan craftsman. You review the itemized scope and price in MAD on your dashboard. No repair work begins and no expenses are incurred without your explicit digital approval.',
  },
  {
    q: 'Are the physical inspections genuinely conducted on-site?',
    a: 'Yes. An authorized local field agent physically visits your property in Tangier, systematically completes a 10-point checklist (entrance, living room, kitchen, bathrooms, bedrooms, windows, locks, plumbing, electricity, general), and takes time-stamped photo evidence. You receive the full PDF report directly in your dashboard.',
  },
  {
    q: 'How are title deeds and rental contracts secured?',
    a: 'Documents are uploaded to isolated private storage buckets. Access links are dynamically generated with signed cryptographic tokens that expire after 5 minutes. Documents are never exposed to public URLs.',
  },
  {
    q: 'What cities are currently covered?',
    a: 'Version 1 is launching focused on Tangier, Morocco. Expansion to Nador, Oujda, Fes, Casablanca, and Rabat will roll out as local operations and certified agent networks are established in each city.',
  },
  {
    q: 'How do you prevent unauthorized work or fake invoices?',
    a: 'Every artisan in our network is identity-verified and registered. Quotes include scope, materials, and labor costs. Payment is only authorized after a completion report with post-repair photographic proof is verified.',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default async function Home() {
  const lang = await language();

  // Load live plan pricing if Supabase is configured
  let plans: {
    id: string;
    name: string;
    monthly_mad: number | null;
    percent_of_collected_rent: number | null;
    details: string;
  }[] = [];

  if (configured()) {
    try {
      const db = await supabaseServer();
      const res = await db
        .from('subscription_plans')
        .select('id,name,monthly_mad,percent_of_collected_rent,details')
        .eq('is_active', true)
        .order('name');
      plans = res.data || [];
    } catch {
      // Fallback to static plans if Supabase is unreachable or misconfigured
      plans = [];
    }
  }

  const fallbackPlans = [
    {
      id: 'basic',
      name: 'Basic Care',
      price: '99 MAD',
      period: '/ mois',
      badge: null,
      description:
        'Ideal for vacant secondary residences needing digital tracking, expense ledger, and secure document storage.',
      features: [
        '1 property registered',
        'Digital owner dashboard',
        'Recorded expense tracking',
        'Secure document vault',
        'Maintenance request coordination',
        'Emergency response dispatch',
      ],
    },
    {
      id: 'care',
      name: 'Care Plus',
      price: '249 MAD',
      period: '/ mois',
      badge: 'LE PLUS POPULAIRE',
      description:
        'Our most popular plan. All Basic features plus quarterly scheduled on-site inspections with photo/video reports.',
      features: [
        '1 property registered',
        'All Basic Care features',
        'Quarterly physical inspection visit',
        'Full 10-point checklist & evidence report',
        'Priority maintenance dispatch',
        'Dedicated bilingual property agent',
      ],
    },
    {
      id: 'full',
      name: 'Full Management',
      price: '8–10%',
      period: 'du loyer perçu',
      badge: null,
      description:
        'Complete end-to-end rental management for apartments and houses generating active rental income.',
      features: [
        'Full tenant coordination & check-in',
        'Rent tracking & receipts',
        'Routine and emergency maintenance',
        'Move-in & move-out field inspections',
        'Monthly cash flow ledger & tax statement',
        'Legalized lease contract archiving',
      ],
    },
  ];

  return (
    <>
      {/* ── Sticky Top Header ────────────────────────────────────────── */}
      <div className="landing-header-wrap">
        <header className="landing-nav">
          <Link href="/" className="brand">
            <span style={{ color: 'var(--gold)', fontSize: 20, marginRight: 4 }}>✦</span>
            <span>DARI<span className="brand-mark">Y</span>A</span>
          </Link>

          <nav className="row" style={{ gap: 8 }}>
            <a href="#how" style={{ padding: '8px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              How it works
            </a>
            <a href="#services" style={{ padding: '8px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              {t(lang, 'service')}
            </a>
            <a href="#plans" style={{ padding: '8px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              {t(lang, 'plans')}
            </a>
            <a href="#faq" style={{ padding: '8px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              FAQ
            </a>
            <a href="#contact" style={{ padding: '8px 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              Contact
            </a>

            <Link href="/login" className="btn light" style={{ marginLeft: 6, padding: '9px 16px', fontSize: 13 }}>
              {t(lang, 'login')}
            </Link>
            <Link href="/signup" className="btn" style={{ padding: '9px 16px', fontSize: 13 }}>
              <span>{t(lang, 'signup')}</span>
              <ArrowUpRight size={14} />
            </Link>

            <LanguagePicker current={lang} />
          </nav>
        </header>
      </div>

      <main className="landing-main">
        {/* ── 1. CENTERED HERO (One under one) ─────────────────────────── */}
        <div className="page-width" style={{ padding: '16px 20px 0' }}>
          <section className="hero-centered fade-up">
            {/* Top eyebrow pill */}
            <div className="hero-badge-pill">
              <span>✦</span>
              <span>VOTRE MAISON AU MAROC · SMART PROPTECH</span>
            </div>

            {/* Centered H1 */}
            <h1>
              Your home in Morocco.<br />
              <span className="hero-accent">Managed from anywhere.</span>
            </h1>

            {/* Centered Description */}
            <p>
              Digital property oversight, licensed physical inspections, vetted maintenance coordination,
              rent tracking and private document vault — all with your approval at every single step.
            </p>

            {/* Centered CTA Buttons */}
            <div className="hero-cta-group">
              <Link href="/signup" className="btn terra lg" style={{ padding: '14px 28px', fontSize: 15 }}>
                <span>Manage my property</span>
                <ArrowUpRight size={17} />
              </Link>
              <a className="btn light lg" href="#how" style={{ padding: '14px 26px', fontSize: 15, background: '#FFFFFF' }}>
                See how it works
              </a>
            </div>

            {/* Centered Location Tag */}
            <div>
              <span className="hero-city-tag">
                <MapPin size={14} style={{ color: 'var(--orange)' }} />
                <span>Launching in Tangier · Pilot registrations now open</span>
              </span>
            </div>

            {/* Hero Showcase Card (Directly underneath the hero text: "One under one") */}
            <div className="hero-showcase">
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#E5EDE8' }}>
                <Image
                  src="/house.svg"
                  width={760}
                  height={420}
                  alt="Moroccan property illustration"
                  style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 380, objectFit: 'cover' }}
                  priority
                />
              </div>

              {/* Live Telemetry Bar */}
              <div className="hero-showcase-meta">
                <div className="row" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--forest)' }}>
                      PROPERTY STATUS
                    </div>
                    <strong style={{ fontSize: 15, color: 'var(--ink)' }}>
                      Tangier Bay Residence · Active
                    </strong>
                  </div>
                  <span className="status-badge status-good">
                    <span className="status-dot" />
                    All checks verified
                  </span>
                </div>

                <div className="row" style={{ gap: 10 }}>
                  {[
                    { label: 'Confirmed Rent', value: '4,500 MAD' },
                    { label: 'Next Inspection', value: '12 Oct 2026' },
                    { label: 'Pending Repairs', value: '0 issues' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        flex: 1,
                        background: '#FFFFFF',
                        border: '1px solid #E5EBE6',
                        borderRadius: 10,
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── 2. CENTERED STATS STRIP (Directly under the hero showcase) ── */}
        <div style={{ width: '100%', padding: '0 20px' }}>
          <div className="stats-strip fade-up fade-up-1">
            {[
              { num: 'Tangier', label: 'First Launch Market' },
              { num: '4 Roles', label: 'Owner · Admin · Agent · Artisan' },
              { num: '10 Zones', label: 'Physical Inspection Points' },
              { num: '100% Private', label: 'Signed Expiring Cloud Links' },
            ].map(({ num, label }) => (
              <div className="stats-strip-item" key={label}>
                <div className="stats-strip-num">{num}</div>
                <div className="stats-strip-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. ALTERNATING ZIGZAG FEATURE SECTION ("One left, one right, etc.") ── */}
        <section className="landing-section" id="how">
          <div className="section-header-center">
            <div className="landing-eyebrow">HOW DARIYA OPERATES</div>
            <h2 className="landing-h2">Complete transparency. Nothing happens without your approval.</h2>
            <p>
              Engineered specifically for Moroccans Living Abroad who need verifiable proof, licensed local coordination, and digital peace of mind.
            </p>
          </div>

          <div className="zigzag-container">
            {/* ROW 1: Left = Text, Right = Card Preview */}
            <div className="zigzag-row">
              <div className="zigzag-content">
                <span className="zigzag-step-tag">
                  <ClipboardCheck size={16} />
                  01 / ON-SITE FIELD INSPECTIONS
                </span>
                <h3 className="zigzag-title">
                  Proof before payment. Standardized 10-point inspection visits.
                </h3>
                <p className="zigzag-desc">
                  Our licensed Tangier field agents physically enter your property, inspect all 10 key zones, record meter readings, test faucets and electrical breakers, and capture high-resolution timestamped photo evidence.
                </p>
                <ul className="zigzag-checklist">
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Standardized 10-zone checklist (doors, windows, plumbing, humidity, roof)</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>High-resolution timestamped photos & digital observation log</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Downloadable inspection reports for insurance and tenant records</span>
                  </li>
                </ul>
              </div>

              {/* Right Card: Inspection Report Mock */}
              <div className="zigzag-card">
                <div className="row" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--forest)', textTransform: 'uppercase' }}>
                    12 OCT 2026 · MALABATA VILLA
                  </span>
                  <span className="status-badge status-good">
                    <span className="status-dot" />
                    Completed
                  </span>
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px', color: 'var(--ink)' }}>
                  Quarterly vacancy & moisture inspection
                </h4>
                <div style={{ background: '#FAFBF9', border: '1px solid #EAEFEA', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: '#3A524B', marginBottom: 6 }}>
                    <strong style={{ color: 'var(--ink)' }}>Finding: </strong>
                    All entrance and balcony locks secure. Water meter readings photographed. Mild moisture noted near bathroom ceiling window, sealed promptly.
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--forest)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={14} />
                    <span>8 verified photographs and signed checklist uploaded</span>
                  </div>
                </div>
                <div className="row" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  <span>Inspected by: Youssef B. (Agent ID: TG-04)</span>
                  <span style={{ fontWeight: 700, color: 'var(--forest)' }}>Verified ✓</span>
                </div>
              </div>
            </div>

            {/* ROW 2: Left = Card Preview, Right = Text (REVERSED) */}
            <div className="zigzag-row reverse">
              <div className="zigzag-content">
                <span className="zigzag-step-tag">
                  <Wrench size={16} />
                  02 / VETTED MAINTENANCE COORDINATION
                </span>
                <h3 className="zigzag-title">
                  Licensed local artisans. Zero unauthorized spending.
                </h3>
                <p className="zigzag-desc">
                  No more asking favors from distant acquaintances. DARIYA maintains a vetted network of plumbers, electricians, painters, and locksmiths in Tangier. You receive itemized estimates in MAD and authorize work directly from your phone.
                </p>
                <ul className="zigzag-checklist">
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Identity-verified and background-checked local Moroccan craftsmen</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Itemized quotes in MAD before any work begins</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Post-intervention photo proof before invoices are cleared</span>
                  </li>
                </ul>
              </div>

              {/* Left Card: Maintenance Quote Mock */}
              <div className="zigzag-card">
                <div className="row" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--orange)', textTransform: 'uppercase' }}>
                    TICKET #312 · RESIDENCE MARINA
                  </span>
                  <span className="status-badge status-warn">
                    <span className="status-dot" />
                    Pending approval
                  </span>
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
                  Water heater thermostat replacement
                </h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>
                  Artisan: Hassan E. (Tangier Plombier Agréé)
                </p>

                <div style={{ background: '#FAFBF9', border: '1px solid #EAEFEA', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>Estimated Cost:</span>
                    <strong style={{ fontSize: 18, color: 'var(--forest)' }}>350 MAD</strong>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                    Scope includes replacement of 1500W heating element and pressure valve testing.
                  </p>
                </div>

                <div className="row" style={{ gap: 10 }}>
                  <button className="btn" style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}>
                    <Check size={14} />
                    Approve quote
                  </button>
                  <button className="btn light" style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}>
                    Request revision
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 3: Left = Text, Right = Card Preview */}
            <div className="zigzag-row">
              <div className="zigzag-content">
                <span className="zigzag-step-tag">
                  <Wallet size={16} />
                  03 / REAL FINANCIAL OVERSIGHT
                </span>
                <h3 className="zigzag-title">
                  Real recorded rental transactions. No messy WhatsApp chat confusion.
                </h3>
                <p className="zigzag-desc">
                  Keep every dirham accounted for. The DARIYA financial ledger displays verified rent collections, utility payments (Amendis), and maintenance disbursements with timestamped receipts and exportable monthly summaries.
                </p>
                <ul className="zigzag-checklist">
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Confirmed transactions only — zero estimated or invented figures</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Automated payment tracking and tenant payment records</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>One-click CSV/PDF export for your personal accounting and tax filing</span>
                  </li>
                </ul>
              </div>

              {/* Right Card: Financial Ledger Mock */}
              <div className="zigzag-card">
                <div className="row" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileSpreadsheet size={18} style={{ color: 'var(--forest)' }} />
                    <strong style={{ fontSize: 15 }}>Financial Statement · Oct 2026</strong>
                  </div>
                  <span className="card-count-badge">Live Ledger</span>
                </div>

                <div className="three" style={{ gap: 10, marginBottom: 16 }}>
                  <div style={{ background: '#FAFBF9', border: '1px solid #EAEFEA', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>RENT RECEIVED</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--forest)', marginTop: 2 }}>4,500 MAD</div>
                  </div>
                  <div style={{ background: '#FAFBF9', border: '1px solid #EAEFEA', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>EXPENSES</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--orange)', marginTop: 2 }}>350 MAD</div>
                  </div>
                  <div style={{ background: '#FAFBF9', border: '1px solid #EAEFEA', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>NET BALANCE</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>+4,150 MAD</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, borderTop: '1px solid #EAEFEA', paddingTop: 12, color: 'var(--muted)' }}>
                  <div className="row">
                    <span>Oct 05 · Tenant Rent Transfer (Apt 4B)</span>
                    <strong style={{ color: 'var(--forest)' }}>+4,500 MAD</strong>
                  </div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <span>Oct 08 · Water Heater Replacement</span>
                    <strong style={{ color: '#B04D3D' }}>-350 MAD</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: Left = Card Preview, Right = Text (REVERSED) */}
            <div className="zigzag-row reverse">
              <div className="zigzag-content">
                <span className="zigzag-step-tag">
                  <FolderCheck size={16} />
                  04 / PRIVATE DIGITAL VAULT
                </span>
                <h3 className="zigzag-title">
                  Your Moroccan property documents. Safe, isolated and accessible 24/7.
                </h3>
                <p className="zigzag-desc">
                  Store title deeds (Moulkiya / Titre Foncier), legalized rental leases, Amendis receipts, and floor plans in a bank-grade digital vault. Every file is strictly private and accessed via temporary 5-minute cryptographic tokens.
                </p>
                <ul className="zigzag-checklist">
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Zero public storage buckets — temporary signed URLs only</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Organized by property, document type, and expiration dates</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Instant access on mobile, tablet, and desktop from abroad</span>
                  </li>
                </ul>
              </div>

              {/* Left Card: Document Vault Mock */}
              <div className="zigzag-card">
                <div className="row" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lock size={18} style={{ color: 'var(--forest)' }} />
                    <strong style={{ fontSize: 15 }}>Encrypted Document Vault</strong>
                  </div>
                  <span className="status-badge status-good">
                    <span className="status-dot" />
                    Isolated
                  </span>
                </div>

                <div className="stack" style={{ gap: 8 }}>
                  {[
                    { name: 'Titre Foncier (Moulkiya) #84920/06', cat: 'Ownership Deed', status: 'Verified' },
                    { name: 'Contrat de Bail Légalisé (2025-2027)', cat: 'Rental Lease', status: 'Active' },
                    { name: 'Facture Amendis Eau & Électricité', cat: 'Utility Bill', status: 'Paid' },
                  ].map((doc) => (
                    <div
                      key={doc.name}
                      style={{
                        background: '#FAFBF9',
                        border: '1px solid #EAEFEA',
                        borderRadius: 10,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{doc.cat}</div>
                      </div>
                      <span className="pill" style={{ fontSize: 11, fontWeight: 700, color: 'var(--forest)', background: '#E8F5EE' }}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="footnote" style={{ marginTop: 14, margin: '14px 0 0', textAlign: 'center' }}>
                  Temporary 5-minute signed links. No files are publicly indexed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. CENTERED SERVICES SECTION ────────────────────────────── */}
        <section className="landing-section" id="services" style={{ background: '#FFFFFF', borderRadius: 24 }}>
          <div className="section-header-center">
            <div className="landing-eyebrow">WHAT DARIYA DOES</div>
            <h2 className="landing-h2">The operating system for your Moroccan property.</h2>
            <p>
              Six modular capabilities designed to eliminate the anxiety of distance and give you complete control.
            </p>
          </div>

          <div className="three fade-up">
            {services.map(({ Icon, title, detail }) => (
              <div className="service-card" key={title}>
                <div className="service-icon">
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                  {title}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. CENTERED DASHBOARD PREVIEW ────────────────────────────── */}
        <section className="landing-section">
          <div className="preview-section fade-up">
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 660, margin: '0 auto 36px' }}>
              <div className="landing-eyebrow" style={{ color: 'var(--gold)' }}>
                UNIFIED REAL-TIME DASHBOARD
              </div>
              <h2 className="landing-h2" style={{ color: '#F8FAF8', marginBottom: 14 }}>
                Everything you need. Nothing you don&apos;t.
              </h2>
              <p style={{ color: '#A9C2BC', fontSize: 16, lineHeight: 1.8, margin: '0 auto 28px' }}>
                One intuitive interface for all your Moroccan properties. View rent, inspect quotes, review inspection logs, and download documents in real time.
              </p>
              <Link href="/signup" className="btn" style={{ background: 'var(--orange)', borderColor: 'var(--orange)', color: '#FFFFFF', fontWeight: 800 }}>
                <span>Create owner account</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, position: 'relative', zIndex: 1 }}>
              {[
                { label: 'Monthly Rent', stat: '4,500 MAD', sub: 'Confirmed payment' },
                { label: 'Maintenance', stat: '350 MAD', sub: 'Last verified repair' },
                { label: 'Next Inspection', stat: 'Oct 12', sub: 'Quarterly visit' },
                { label: 'Open Issues', stat: '0 open', sub: 'Fully resolved' },
              ].map(({ label, stat, sub }) => (
                <div className="preview-card" key={label}>
                  <div className="preview-label">{label}</div>
                  <div className="preview-stat">{stat}</div>
                  <div style={{ fontSize: 12, color: '#7E9C95', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. CENTERED PRICING SECTION ──────────────────────────────── */}
        <section className="landing-section" id="plans" style={{ background: '#FFFFFF', borderRadius: 24 }}>
          <div className="section-header-center">
            <div className="landing-eyebrow">TRANSPARENT PRICING</div>
            <h2 className="landing-h2">Plans built around the support you need.</h2>
            <p>
              Transparent monthly plans with no hidden fees. All prices are in Moroccan dirhams (MAD).
            </p>
          </div>

          <div className="pricing-grid fade-up">
            {fallbackPlans.map((plan) => (
              <div
                key={plan.id}
                className={`pricing-card ${plan.id === 'care' ? 'featured' : ''}`}
              >
                {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: plan.id === 'care' ? 'var(--gold)' : 'var(--forest)' }}>
                    {plan.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 6px' }}>
                    <span className="pricing-amount">{plan.price}</span>
                    <span style={{ fontSize: 13, color: plan.id === 'care' ? '#A9C2BC' : 'var(--muted)' }}>
                      {plan.period}
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: plan.id === 'care' ? '#BDD0CC' : 'var(--muted)', margin: 0 }}>
                    {plan.description}
                  </p>
                </div>

                <ul className="pricing-features" style={{ margin: '8px 0 auto' }}>
                  {plan.features.map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`btn ${plan.id === 'care' ? 'terra' : 'light'}`}
                  style={{ width: '100%', marginTop: 12 }}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. CENTERED WHY DARIYA ───────────────────────────────────── */}
        <section className="landing-section">
          <div className="section-header-center">
            <div className="landing-eyebrow">TRUST & INTEGRITY</div>
            <h2 className="landing-h2">Built for trust, not just technology.</h2>
            <p>
              We treat remote property management as an operational responsibility, ensuring verified people and honest records.
            </p>
          </div>

          <div className="why-grid fade-up">
            {whyItems.map(({ Icon, title, body }) => (
              <div className="why-item" key={title}>
                <div className="why-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>
                    {title}
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. CENTERED TESTIMONIALS ─────────────────────────────────── */}
        <section className="landing-section">
          <div className="section-header-center">
            <div className="landing-eyebrow">COMMUNITY PERSPECTIVE</div>
            <h2 className="landing-h2">Tested by property owners abroad.</h2>
            <p>
              Feedback from Moroccan diaspora homeowners validating the need for on-the-ground proof.
            </p>
          </div>

          <div className="testimonials-grid fade-up">
            {[
              {
                quote:
                  'Managing a vacation apartment in Tangier from Paris was always stressful. Knowing an agent checks the water meter and locks every quarter gives me total peace of mind.',
                author: 'Yasmine B.',
                city: 'Paris · Apartment in Tangier Marina',
                initials: 'YB',
              },
              {
                quote:
                  'I had an air conditioner water leak last summer that could have ruined the flooring. Having a verified technician dispatched with an approved quote saved me thousands.',
                author: 'Karim M.',
                city: 'Brussels · Villa in Malabata',
                initials: 'KM',
              },
              {
                quote:
                  'The rental tracking is clean and simple. I have all my lease documents and receipts in one place instead of digging through lost email attachments.',
                author: 'Mehdi T.',
                city: 'Madrid · 2 Apartments in Tangier',
                initials: 'MT',
              },
            ].map((tItem) => (
              <div className="testimonial-card" key={tItem.author}>
                <p className="testimonial-quote">&ldquo;{tItem.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{tItem.initials}</div>
                  <div>
                    <div className="testimonial-name">{tItem.author}</div>
                    <div className="testimonial-city">{tItem.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="testimonials-notice">
            * Early user pilot feedback. Full service launching in Tangier, Morocco.
          </p>
        </section>

        {/* ── 9. CENTERED FAQ ACCORDION ─────────────────────────────────── */}
        <section className="landing-section" id="faq">
          <div className="section-header-center">
            <div className="landing-eyebrow">COMMON QUESTIONS</div>
            <h2 className="landing-h2">Frequently asked questions.</h2>
            <p>Everything you need to know about our operations, fees, and procedures.</p>
          </div>

          <div className="faq-list fade-up" style={{ maxWidth: 840, margin: '0 auto' }}>
            {faqs.map(({ q, a }) => (
              <details key={q} className="faq-item">
                <summary className="faq-q">
                  <span>{q}</span>
                  <ChevronDown size={18} style={{ color: 'var(--muted)' }} />
                </summary>
                <div className="faq-a">{a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ── 10. CENTERED CONTACT SECTION ─────────────────────────────── */}
        <section className="landing-section" id="contact">
          <div className="section-header-center">
            <div className="landing-eyebrow">GET IN TOUCH</div>
            <h2 className="landing-h2">Start with peace of mind.</h2>
            <p>
              Register your interest for our Tangier launch pilot or schedule a personalized consultation.
            </p>
          </div>

          <div className="contact-section fade-up">
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px', color: 'var(--ink)' }}>
                Our operations hub in Tangier
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Our team is based locally in Tangier to coordinate inspections, supervise maintenance, and manage owner documentation.
              </p>

              <div className="contact-channels">
                <div className="contact-channel">
                  <div className="contact-channel-icon">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--forest)', textTransform: 'uppercase' }}>
                      LOCATION
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                      Tangier, Morocco (Tanger-Tétouan-Al Hoceïma)
                    </div>
                  </div>
                </div>

                <div className="contact-channel">
                  <div className="contact-channel-icon">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--forest)', textTransform: 'uppercase' }}>
                      EMAIL US
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                      contact@dariya.ma
                    </div>
                  </div>
                </div>

                <div className="contact-channel">
                  <div className="contact-channel-icon">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--forest)', textTransform: 'uppercase' }}>
                      WHATSAPP & PHONE
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                      +212 539 00 00 00
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest Registration Form */}
            <div style={{ background: '#FAFBF8', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
              <h4 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
                Register for early pilot access
              </h4>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
                Join our private Tangier owner cohort. We&apos;ll schedule an introductory onboarding call.
              </p>

              <form action="/signup" className="stack" style={{ gap: 12 }}>
                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Full Name</label>
                  <input type="text" placeholder="Omar Zaryah" required />
                </div>
                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Email Address</label>
                  <input type="email" placeholder="owner@dariya.ma" required />
                </div>
                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Property Type in Tangier</label>
                  <select>
                    <option>Apartment (Appartement)</option>
                    <option>Villa / Family House</option>
                    <option>Rental Unit / Airbnb</option>
                    <option>Commercial Property</option>
                  </select>
                </div>
                <button className="btn" type="submit" style={{ width: '100%', marginTop: 6, padding: '12px' }}>
                  Register for pilot access ↗
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span style={{ color: 'var(--gold)', fontSize: 20, marginRight: 6 }}>✦</span>
              <span>DARI<span style={{ color: 'var(--orange)' }}>Y</span>A</span>
            </div>
            <p className="footer-tagline">
              Digital property management for Moroccans Living Abroad. Your home in Morocco, managed from anywhere.
            </p>
          </div>

          <div className="footer-col">
            <h4>PLATFORM</h4>
            <a href="#how">How it works</a>
            <a href="#services">Services</a>
            <a href="#plans">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="footer-col">
            <h4>ACCOUNT</h4>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
            <Link href="/forgot-password">Reset password</Link>
          </div>

          <div className="footer-col">
            <h4>COVERAGE</h4>
            <span style={{ display: 'block', fontSize: 14, color: '#FFFFFF', marginBottom: 6, fontWeight: 700 }}>
              Tangier (Launch)
            </span>
            <span style={{ display: 'block', fontSize: 13, color: '#7BA6AA' }}>Nador (Coming soon)</span>
            <span style={{ display: 'block', fontSize: 13, color: '#7BA6AA' }}>Oujda (Coming soon)</span>
            <span style={{ display: 'block', fontSize: 13, color: '#7BA6AA' }}>Casablanca (Planned)</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} DARIYA Technologies SARL. All rights reserved.</span>
          <span>Tangier, Morocco · Version 1 Pilot</span>
        </div>
      </footer>
    </>
  );
}
